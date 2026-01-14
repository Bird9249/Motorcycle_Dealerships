/**
 * Chunk Upload Utilities for Amazing Global Trading
 * Handles large file uploads by splitting files into smaller chunks
 */

export interface ChunkUploadOptions {
  /** Chunk size in bytes (default: 1MB) */
  chunkSize?: number;
  /** Maximum number of concurrent uploads (default: 3) */
  concurrency?: number;
  /** Maximum retry attempts per chunk (default: 3) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
  /** Error callback */
  onError?: (error: UploadError) => void;
  /** Success callback */
  onSuccess?: (result: UploadResult) => void;
}

export interface UploadProgress {
  /** Total bytes uploaded */
  uploaded: number;
  /** Total bytes to upload */
  total: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Current chunk being uploaded */
  currentChunk: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  eta?: number;
}

export interface UploadError {
  /** Error type */
  type: "chunk_error" | "network_error" | "server_error" | "timeout";
  /** Error message */
  message: string;
  /** Chunk index that failed */
  chunkIndex?: number;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Whether the error is recoverable */
  recoverable: boolean;
}

export interface UploadResult {
  /** Upload session ID */
  uploadId: string;
  /** Final file URL */
  fileUrl: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** File name */
  fileName: string;
}

export interface ChunkMetadata {
  /** Upload session ID */
  uploadId: string;
  /** Chunk index (0-based) */
  chunkIndex: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Chunk size in bytes */
  chunkSize: number;
  /** Total file size in bytes */
  totalSize: number;
  /** File name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File hash for integrity check */
  fileHash: string;
  /** Whether this is the last chunk */
  isLast: boolean;
}

export class ChunkUploadManager {
  private file: File;
  private options: Required<ChunkUploadOptions>;
  private uploadId: string | null = null;
  private chunks: Blob[];
  private uploadedChunks: Set<number> = new Set();
  private isAborted = false;
  private startTime = 0;
  private lastProgressTime = 0;
  private lastUploadedBytes = 0;

  constructor(file: File, options: ChunkUploadOptions = {}) {
    this.file = file;
    this.options = {
      chunkSize: 1024 * 1024, // 1MB default
      concurrency: 3,
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: () => {},
      onError: () => {},
      onSuccess: () => {},
      ...options,
    };

    this.chunks = this.splitFileIntoChunks();
  }

  /**
   * Split file into chunks
   */
  private splitFileIntoChunks(): Blob[] {
    const chunks: Blob[] = [];
    const { chunkSize } = this.options;
    const totalChunks = Math.ceil(this.file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, this.file.size);
      chunks.push(this.file.slice(start, end));
    }

    return chunks;
  }

  /**
   * Generate file hash for integrity check
   */
  private async generateFileHash(): Promise<string> {
    const buffer = await this.file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Initialize upload session
   */
  private async initializeUpload(): Promise<string> {
    const fileHash = await this.generateFileHash();

    const response = await fetch("/api/media/upload/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        fileName: this.file.name,
        fileSize: this.file.size,
        mimeType: this.file.type,
        fileHash,
        totalChunks: this.chunks.length,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize upload: ${response.statusText}`);
    }

    const result = await response.json();
    this.uploadId = result.uploadId;
    return this.uploadId!;
  }

  /**
   * Upload a single chunk with retry logic
   */
  private async uploadChunk(chunkIndex: number, retryCount = 0): Promise<void> {
    if (this.isAborted) return;

    try {
      const chunk = this.chunks[chunkIndex];
      const formData = new FormData();

      formData.append("chunk", chunk!);
      if (!this.uploadId) {
        throw new Error("Upload session not initialized");
      }
      formData.append("uploadId", this.uploadId);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", this.chunks.length.toString());

      const response = await fetch("/api/media/upload/chunk", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.uploadedChunks.add(chunkIndex);
      this.updateProgress();
    } catch (error) {
      if (retryCount < this.options.maxRetries) {
        console.warn(
          `Chunk ${chunkIndex} failed, retrying (${retryCount + 1}/${this.options.maxRetries})`,
        );
        await this.delay(this.options.retryDelay * (retryCount + 1)); // Exponential backoff
        return this.uploadChunk(chunkIndex, retryCount + 1);
      }

      const uploadError: UploadError = {
        type:
          error instanceof Error && error.message.includes("HTTP")
            ? "server_error"
            : "network_error",
        message: error instanceof Error ? error.message : "Unknown error",
        chunkIndex,
        recoverable: retryCount < this.options.maxRetries,
      };

      this.options.onError(uploadError);
      throw error;
    }
  }

  /**
   * Complete upload session
   */
  private async completeUpload(): Promise<UploadResult> {
    const response = await fetch("/api/media/upload/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadId: this.uploadId,
        fileName: this.file.name,
        mimeType: this.file.type,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to complete upload: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update progress and call callback
   */
  private updateProgress(): void {
    const uploaded = this.uploadedChunks.size * this.options.chunkSize;
    const total = this.file.size;
    const percentage = Math.round((uploaded / total) * 100);

    const now = Date.now();
    const timeDiff = now - this.lastProgressTime;
    const bytesDiff = uploaded - this.lastUploadedBytes;

    let speed: number | undefined;
    let eta: number | undefined;

    if (timeDiff > 1000 && bytesDiff > 0) {
      // Update speed every second
      speed = (bytesDiff / timeDiff) * 1000; // bytes per second
      const remaining = total - uploaded;
      eta = remaining / speed;

      this.lastProgressTime = now;
      this.lastUploadedBytes = uploaded;
    }

    const progress: UploadProgress = {
      uploaded,
      total,
      percentage,
      currentChunk: this.uploadedChunks.size,
      totalChunks: this.chunks.length,
      speed,
      eta,
    };

    this.options.onProgress(progress);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start upload process
   */
  async start(): Promise<UploadResult> {
    if (this.isAborted) {
      throw new Error("Upload was aborted");
    }

    this.startTime = Date.now();
    this.lastProgressTime = this.startTime;
    this.lastUploadedBytes = 0;

    try {
      // Initialize upload session
      await this.initializeUpload();

      // Upload chunks concurrently with limited concurrency
      const uploadPromises: Promise<void>[] = [];
      const semaphore = new Semaphore(this.options.concurrency);

      for (let i = 0; i < this.chunks.length; i++) {
        if (this.uploadedChunks.has(i)) continue; // Skip already uploaded chunks

        await semaphore.acquire();
        const promise = this.uploadChunk(i).finally(() => semaphore.release());
        uploadPromises.push(promise);
      }

      // Wait for all chunks to complete
      await Promise.all(uploadPromises);

      // Complete upload
      const result = await this.completeUpload();

      this.options.onSuccess(result);
      return result;
    } catch (error) {
      const uploadError: UploadError = {
        type: "chunk_error",
        message: error instanceof Error ? error.message : "Upload failed",
        recoverable: false,
      };

      this.options.onError(uploadError);
      throw error;
    }
  }

  /**
   * Abort upload
   */
  abort(): void {
    this.isAborted = true;
  }

  /**
   * Get upload statistics
   */
  getStats() {
    const elapsed = Date.now() - this.startTime;
    const uploaded = this.uploadedChunks.size * this.options.chunkSize;
    const speed = elapsed > 0 ? (uploaded / elapsed) * 1000 : 0;

    return {
      elapsed,
      uploaded,
      total: this.file.size,
      speed,
      completedChunks: this.uploadedChunks.size,
      totalChunks: this.chunks.length,
      isAborted: this.isAborted,
    };
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      if (resolve) {
        this.permits--;
        resolve();
      }
    }
  }
}

/**
 * Convenience function to upload file with chunking
 */
export async function uploadFileWithChunks(
  file: File,
  options: ChunkUploadOptions = {},
): Promise<UploadResult> {
  const uploader = new ChunkUploadManager(file, options);
  return uploader.start();
}

/**
 * Check if file should use chunk upload based on size
 */
export function shouldUseChunkUpload(
  file: File,
  threshold = 5 * 1024 * 1024,
): boolean {
  return file.size > threshold; // Default 10MB
}

/**
 * Get optimal chunk size based on file size
 */
export function getOptimalChunkSize(fileSize: number): number {
  if (fileSize < 10 * 1024 * 1024) return 1024 * 1024; // 1MB for small files
  if (fileSize < 100 * 1024 * 1024) return 2 * 1024 * 1024; // 2MB for medium files
  if (fileSize < 1024 * 1024 * 1024) return 5 * 1024 * 1024; // 5MB for large files
  return 10 * 1024 * 1024; // 10MB for very large files
}
