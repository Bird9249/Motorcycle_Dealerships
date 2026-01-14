/**
 * Client-side image compression utility using browser-image-compression
 * Converts images to WebP format and compresses them
 */

import imageCompression from "browser-image-compression";

export interface ImageCompressOptions {
  /**
   * Maximum file size in MB (default: 1)
   */
  maxSizeMB?: number;
  /**
   * Maximum width or height in pixels (default: 1920)
   */
  maxWidthOrHeight?: number;
  /**
   * Image quality (0-1, default: 0.8)
   */
  quality?: number;
  /**
   * Whether to convert to WebP format (default: true)
   */
  convertToWebP?: boolean;
  /**
   * Whether to use web worker (default: true)
   */
  useWebWorker?: boolean;
}

/**
 * Compresses an image file and converts it to WebP format
 */
export async function compressImageToWebP(
  file: File,
  options?: ImageCompressOptions,
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    convertToWebP = true,
    useWebWorker = true,
  } = options ?? {};

  try {
    // Compress the image
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      fileType: convertToWebP ? "image/webp" : undefined,
      initialQuality: quality,
    });

    // If WebP conversion is requested but not supported by browser-image-compression,
    // we need to convert manually using Canvas API
    if (convertToWebP && !compressedFile.type.includes("webp")) {
      return await convertToWebPFormat(compressedFile, quality);
    }

    // Ensure file extension is .webp when convertToWebP is true
    if (convertToWebP && compressedFile.type.includes("webp")) {
      // Handle both cases: file with extension and file without extension
      // Also handle case where file.name is "blob" or empty
      let baseName = file.name.replace(/\.[^/.]+$/, "") || file.name;
      // If baseName is "blob" or empty, use a default name
      if (!baseName || baseName === "blob" || baseName.trim() === "") {
        baseName = "image";
      }
      const webpFileName = `${baseName}.webp`;
      // Always create new File to ensure proper name and extension
      return new File([compressedFile], webpFileName, {
        type: "image/webp",
        lastModified: compressedFile.lastModified,
      });
    }

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Converts an image file to WebP format using Canvas API
 */
async function convertToWebPFormat(file: File, quality = 0.8): Promise<File> {
  // Check if we're in a browser environment
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error(
      "convertToWebPFormat requires browser environment. Use browser-image-compression with fileType option instead.",
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image to WebP"));
              return;
            }

            // Handle both cases: file with extension and file without extension
            // Also handle case where file.name is "blob" or empty
            let baseName = file.name.replace(/\.[^/.]+$/, "") || file.name;
            // If baseName is "blob" or empty, use a default name
            if (!baseName || baseName === "blob" || baseName.trim() === "") {
              baseName = "image";
            }
            const webpFileName = `${baseName}.webp`;
            const webpFile = new File([blob], webpFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
