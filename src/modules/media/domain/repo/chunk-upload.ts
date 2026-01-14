import { chunkUploadSessions, chunkUploads } from "@/platform/db/schema";
import { formatNow } from "@/shared/lib/date-time";
import { and, eq, sql } from "drizzle-orm";
import { rmdir } from "node:fs/promises";
import type { DbTransaction } from "../../../../shared/types";

// Create chunk upload session
export async function createChunkUploadSession(
  data: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileHash: string;
    totalChunks: number;
    tempDir?: string;
    createdBy?: string | null;
    expiresAt?: string;
  },
  client: DbTransaction,
) {
  const now = formatNow();
  const expiresAt =
    data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  const [session] = await client
    .insert(chunkUploadSessions)
    .values({
      ...data,
      expiresAt,
      status: "initializing",
      uploadedChunks: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return session;
}

// Get chunk upload session by ID
export async function getChunkUploadSession(
  sessionId: string,
  client: DbTransaction,
) {
  const [session] = await client
    .select()
    .from(chunkUploadSessions)
    .where(eq(chunkUploadSessions.id, sessionId));

  return session;
}

// Update chunk upload session
export async function updateChunkUploadSession(
  sessionId: string,
  updates: Partial<{
    uploadedChunks: number;
    status: "initializing" | "uploading" | "completed" | "failed" | "cancelled";
    tempDir: string;
    finalFileUrl: string;
  }>,
  client: DbTransaction,
) {
  const now = formatNow();

  const [session] = await client
    .update(chunkUploadSessions)
    .set({
      ...updates,
      updatedAt: now,
    })
    .where(eq(chunkUploadSessions.id, sessionId))
    .returning();

  return session;
}

// Create chunk upload record
export async function createChunkUpload(
  data: {
    sessionId: string;
    chunkIndex: number;
    chunkSize: number;
    chunkHash: string;
    tempFilePath: string;
  },
  client: DbTransaction,
) {
  const [chunk] = await client.insert(chunkUploads).values(data).returning();

  return chunk;
}

// Check if chunk exists
export async function getChunkUpload(
  sessionId: string,
  chunkIndex: number,
  client: DbTransaction,
) {
  const [chunk] = await client
    .select()
    .from(chunkUploads)
    .where(
      and(
        eq(chunkUploads.sessionId, sessionId),
        eq(chunkUploads.chunkIndex, chunkIndex),
      ),
    );

  return chunk;
}

// Count chunks for a session
export async function countSessionChunks(
  sessionId: string,
  client: DbTransaction,
): Promise<number> {
  try {
    // Try count query first
    const result = await client
      .select({ count: sql`count(*)` })
      .from(chunkUploads)
      .where(eq(chunkUploads.sessionId, sessionId));

    if (result && result[0] && typeof result[0].count !== "undefined") {
      const count = Number(result[0].count) || 0;
      return count;
    }

    // Fallback: query all and count
    const chunks = await client
      .select({ id: chunkUploads.id })
      .from(chunkUploads)
      .where(eq(chunkUploads.sessionId, sessionId));

    const count = chunks.length;
    console.log("countSessionChunks fallback count:", count);
    return count;
  } catch (error) {
    console.error("countSessionChunks error:", error);
    // Last resort fallback
    return 0;
  }
}

// Get all chunks for a session
export async function getSessionChunks(
  sessionId: string,
  client: DbTransaction,
) {
  return await client
    .select()
    .from(chunkUploads)
    .where(eq(chunkUploads.sessionId, sessionId))
    .orderBy(chunkUploads.chunkIndex);
}

// Delete chunk upload session and all its chunks
export async function deleteChunkUploadSession(
  sessionId: string,
  client: DbTransaction,
) {
  // Delete chunks first (cascade should handle this, but being explicit)
  await client
    .delete(chunkUploads)
    .where(eq(chunkUploads.sessionId, sessionId));

  // Delete session
  const result = await client
    .delete(chunkUploadSessions)
    .where(eq(chunkUploadSessions.id, sessionId));

  return (result as any).rowCount > 0;
}

// Clean up chunk files from filesystem
export async function cleanupChunkFiles(
  chunks: { tempFilePath: string }[],
): Promise<void> {
  // First, delete all individual chunk files
  const cleanupPromises = chunks.map(async (chunk) => {
    try {
      // Convert URL path to filesystem path
      const filePath = chunk.tempFilePath.replace(/^\/public\//, "public/");
      const chunkFile = Bun.file(filePath);

      if (await chunkFile.exists()) {
        await chunkFile.delete();
      }
    } catch (error) {
      // Log error but continue with other files
      console.warn(`Failed to delete chunk file ${chunk.tempFilePath}:`, error);
    }
  });

  await Promise.all(cleanupPromises);

  // Then, try to delete the temp directory if it exists and is empty
  if (chunks.length > 0) {
    try {
      // Extract temp directory path from the first chunk
      const firstChunkPath = chunks[0]?.tempFilePath?.replace(
        /^\/public\//,
        "public/",
      );
      if (firstChunkPath) {
        const tempDir = firstChunkPath.substring(
          0,
          firstChunkPath.lastIndexOf("/"),
        );

        // Check if directory exists and try to remove it (only if empty)
        try {
          await rmdir(tempDir);
        } catch {
          // Directory doesn't exist, not empty, or can't be removed, ignore
        }
      }
    } catch (error) {
      // Log error but don't fail the cleanup
      console.warn("Failed to delete temp directory:", error);
    }
  }
}

// Clean up chunk records from database
export async function cleanupChunkRecords(
  sessionId: string,
  client: DbTransaction,
): Promise<void> {
  try {
    await client
      .delete(chunkUploads)
      .where(eq(chunkUploads.sessionId, sessionId));
  } catch (error) {
    console.warn(
      `Failed to delete chunk records for session ${sessionId}:`,
      error,
    );
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(client: DbTransaction) {
  const now = formatNow();

  // Get expired sessions
  const expiredSessions = await client
    .select({
      id: chunkUploadSessions.id,
      tempDir: chunkUploadSessions.tempDir,
    })
    .from(chunkUploadSessions)
    .where(
      and(
        sql`${chunkUploadSessions.expiresAt} < ${now}`,
        sql`${chunkUploadSessions.status} != 'completed'`,
      ),
    );

  if (expiredSessions.length === 0) {
    return { deletedCount: 0, cleanedDirs: [] };
  }

  // Delete expired sessions (chunks will be deleted via cascade)
  await client
    .delete(chunkUploadSessions)
    .where(
      sql`${chunkUploadSessions.expiresAt} < ${now} AND ${chunkUploadSessions.status} != 'completed'`,
    );

  return {
    deletedCount: expiredSessions.length,
    cleanedDirs: expiredSessions.map((s) => s.tempDir).filter(Boolean),
  };
}

// Get session statistics
export async function getSessionStats(
  sessionId: string,
  client: DbTransaction,
) {
  const session = await getChunkUploadSession(sessionId, client);
  if (!session) return null;

  const chunks = await getSessionChunks(sessionId, client);

  return {
    session,
    chunks,
    progress:
      session.totalChunks > 0 ? (chunks.length / session.totalChunks) * 100 : 0,
    isComplete: chunks.length === session.totalChunks,
  };
}
