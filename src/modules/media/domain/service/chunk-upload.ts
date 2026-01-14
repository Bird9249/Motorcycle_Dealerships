import { formatNow } from "@/shared/lib/date-time";
import { nanoid } from "nanoid";
import { join } from "node:path";
import { bunFileStorage } from "../../../../shared/files/bun-storage";
import { makeService } from "../../../../shared/service";
import type { CompleteUploadDTO, InitiateUploadDTO } from "../contracts";
import {
  cleanupChunkFiles,
  cleanupChunkRecords,
  countSessionChunks,
  createChunkUpload,
  createChunkUploadSession,
  getChunkUpload,
  getChunkUploadSession,
  getSessionChunks,
  updateChunkUploadSession,
} from "../repo/chunk-upload";
import { createMedia } from "../repo/create";

// Initiate chunk upload session
export const initiateChunkUploadService = makeService<
  InitiateUploadDTO,
  { uploadId: string; chunkSize: number }
>({
  name: "chunkUploadInitiate",
  run: async (
    client,
    { fileName, fileSize, mimeType, fileHash, totalChunks },
  ) => {
    // Validate file size (max 1GB)
    const maxFileSize = 1024 * 1024 * 1024; // 1GB
    if (fileSize > maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${maxFileSize} bytes`,
      );
    }

    // Create temporary directory for chunks
    const tempDir = `temp-chunks-${nanoid()}`;

    // Create upload session
    const session = await createChunkUploadSession(
      {
        fileName,
        mimeType,
        fileSize,
        fileHash,
        totalChunks,
        tempDir,
      },
      client,
    );

    // Calculate optimal chunk size (1MB default, but can be adjusted)
    const chunkSize = Math.ceil(fileSize / totalChunks);

    return {
      uploadId: session!.id,
      chunkSize,
    };
  },
});

// Upload chunk service
export const uploadChunkService = makeService<
  {
    chunk: File;
    uploadId: string;
    chunkIndex: number;
    totalChunks: number;
  },
  { success: boolean; chunkIndex: number }
>({
  name: "chunkUploadChunk",
  run: async (client, { chunk, uploadId, chunkIndex, totalChunks }) => {
    // Get session
    const session = await getChunkUploadSession(uploadId, client);
    if (!session) {
      throw new Error("Upload session not found");
    }

    if (session.status === "completed") {
      throw new Error("Upload session already completed");
    }

    if (session.status === "failed") {
      throw new Error("Upload session has failed");
    }

    if (session.totalChunks !== totalChunks) {
      throw new Error("Total chunks mismatch");
    }

    // Check if chunk already exists
    const existingChunk = await getChunkUpload(uploadId, chunkIndex, client);
    if (existingChunk) {
      return { success: true, chunkIndex };
    }

    // Save chunk to temporary storage
    const tempDir = session.tempDir || `temp-chunks-${uploadId}`;
    const saved = await bunFileStorage.save(chunk, tempDir);

    // Generate chunk hash
    const chunkBuffer = await chunk.arrayBuffer();
    const chunkHash = await crypto.subtle.digest("SHA-256", chunkBuffer);
    const chunkHashString = Array.from(new Uint8Array(chunkHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Save chunk record
    await createChunkUpload(
      {
        sessionId: uploadId,
        chunkIndex,
        chunkSize: chunk.size,
        chunkHash: chunkHashString,
        tempFilePath: saved.url,
      },
      client,
    );

    // Update session progress - count actual chunks to avoid race conditions
    const updatedChunks = await countSessionChunks(uploadId, client);

    // Use session.totalChunks as fallback if param is undefined
    const actualTotalChunks = totalChunks || session.totalChunks;
    const newStatus =
      updatedChunks === actualTotalChunks ? "completed" : "uploading";

    await updateChunkUploadSession(
      uploadId,
      {
        uploadedChunks: updatedChunks,
        status: newStatus,
      },
      client,
    );

    return { success: true, chunkIndex };
  },
});

// Complete chunk upload service
export const completeChunkUploadService = makeService<
  CompleteUploadDTO,
  {
    uploadId: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    fileName: string;
  }
>({
  name: "chunkUploadComplete",
  run: async (client, { uploadId, fileName, mimeType }) => {
    // Get session
    const session = await getChunkUploadSession(uploadId, client);
    if (!session) {
      throw new Error("Upload session not found");
    }

    if (session.status !== "completed") {
      throw new Error("Upload session is not ready for completion");
    }

    // Get all chunks
    const chunks = await getSessionChunks(uploadId, client);
    if (chunks.length !== session.totalChunks) {
      throw new Error("Not all chunks have been uploaded");
    }

    // Sort chunks by index
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    try {
      // Merge chunks into final file
      const tempDir = session.tempDir || `temp-chunks-${uploadId}`;
      const finalFileName = `${fileName}`;
      const _finalFilePath = join(tempDir, finalFileName);

      // Create final file by concatenating chunks
      const finalFileBuffer = new Uint8Array(session.fileSize);
      let offset = 0;

      for (const chunk of chunks) {
        try {
          // Read chunk data - convert URL path to filesystem path
          // tempFilePath is like "/public/temp-chunks-xxx/chunk-1.jpg"
          // Convert to "public/temp-chunks-xxx/chunk-1.jpg"
          const filePath = chunk.tempFilePath.replace(/^\/public\//, "public/");
          const chunkFile = Bun.file(filePath);

          if (!(await chunkFile.exists())) {
            throw new Error(`Chunk file does not exist: ${filePath}`);
          }

          const chunkData = await chunkFile.arrayBuffer();
          finalFileBuffer.set(new Uint8Array(chunkData), offset);
          offset += chunk.chunkSize;
        } catch (error) {
          throw new Error(`Failed to read chunk ${chunk.chunkIndex}: ${error}`);
        }
      }

      // Save final file
      const finalBlob = new Blob([finalFileBuffer], { type: mimeType });
      const finalFile = new File([finalBlob], finalFileName, {
        type: mimeType,
      });
      const saved = await bunFileStorage.save(finalFile, "uploads/media");

      // Update session with final file URL
      await updateChunkUploadSession(
        uploadId,
        {
          finalFileUrl: saved.url,
        },
        client,
      );

      // Create media asset record
      await createMedia(
        {
          fileUrl: saved.url,
          altText: null,
          mimeType,
          fileName,
          fileSize: session.fileSize,
          width: null,
          height: null,
          createdBy: session.createdBy,
          archived: false,
          createdAt: formatNow(),
          updatedAt: formatNow(),
        },
        client,
      );

      // Clean up chunks and temporary files
      try {
        await cleanupChunkFiles(chunks);
        await cleanupChunkRecords(uploadId, client);
      } catch (cleanupError) {
        // Log cleanup error but don't fail the upload
        console.warn("Failed to cleanup chunks:", cleanupError);
      }

      return {
        uploadId,
        fileUrl: saved.url,
        fileSize: session.fileSize,
        mimeType,
        fileName,
      };
    } catch (error) {
      // Mark session as failed
      await updateChunkUploadSession(uploadId, { status: "failed" }, client);
      throw error;
    }
  },
});

// Get upload status service
export const getUploadStatusService = makeService<
  { uploadId: string },
  {
    uploadId: string;
    status: string;
    uploadedChunks: number;
    totalChunks: number;
    progress: number;
    fileSize: number;
    uploadedBytes: number;
  }
>({
  name: "chunkUploadStatus",
  run: async (client, { uploadId }) => {
    const session = await getChunkUploadSession(uploadId, client);
    if (!session) {
      throw new Error("Upload session not found");
    }

    const chunks = await getSessionChunks(uploadId, client);
    const uploadedBytes = chunks.reduce(
      (sum, chunk) => sum + chunk.chunkSize,
      0,
    );
    const progress =
      session.totalChunks > 0 ? (chunks.length / session.totalChunks) * 100 : 0;

    return {
      uploadId,
      status: session.status,
      uploadedChunks: chunks.length,
      totalChunks: session.totalChunks,
      progress,
      fileSize: session.fileSize,
      uploadedBytes,
    };
  },
});

// Cancel upload service
export const cancelChunkUploadService = makeService<
  { uploadId: string },
  { success: boolean }
>({
  name: "chunkUploadCancel",
  run: async (client, { uploadId }) => {
    const session = await getChunkUploadSession(uploadId, client);
    if (!session) {
      throw new Error("Upload session not found");
    }

    if (session.status === "completed") {
      throw new Error("Cannot cancel completed upload");
    }

    // Update status to cancelled
    await updateChunkUploadSession(uploadId, { status: "cancelled" }, client);

    // TODO: Clean up temporary files

    return { success: true };
  },
});
