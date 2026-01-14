import {
  ChunkUploadManager,
  shouldUseChunkUpload,
  type UploadError,
  type UploadProgress,
} from "@/shared/lib/chunk-upload";
import { compressImageToWebP } from "@/shared/lib/image-compress";
import {
  Button,
  Field,
  FormInput,
  FormRoot,
  Modal,
  Progress,
  RHF,
  zodResolver,
} from "@devhop/ui";
import { useEffect, useState } from "react";
import { z } from "zod";

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file.type.startsWith("image/")) {
    return (
      <div className="flex aspect-square items-center justify-center overflow-hidden break-all rounded border bg-muted p-1 text-center text-xs leading-tight">
        {file.name}
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded border bg-muted">
      {url && (
        <img src={url} alt="preview" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

const MediaUploadFormSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, "ຕ້ອງເລືອກຢ່າງນ້ອຍ 1 ຟາຍ"),
  altText: z.string().optional(),
  fileName: z.string().optional(),
});

export type MediaUploadFormValues = z.infer<typeof MediaUploadFormSchema>;

import { useCreateMedia } from "@/modules/media/presentation/api/queries";
import { toast } from "sonner";

export function MediaUploadModal({
  open,
  onOpenChange,
  onUploadComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (ids: string[]) => void;
}) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isChunkUploading, setIsChunkUploading] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<UploadProgress | null>(
    null,
  );
  const [chunkError, setChunkError] = useState<UploadError | null>(null);

  const createMedia = useCreateMedia();
  const submitting = createMedia.isPending;

  const methods = RHF.useForm<MediaUploadFormValues>({
    resolver: zodResolver(MediaUploadFormSchema),
    defaultValues: {
      files: [],
      altText: "",
      fileName: "",
    },
  });

  // Watch files to extract base name from first file if fileName is empty
  const selectedFiles = RHF.useWatch({
    control: methods.control,
    name: "files",
  });
  const currentFileName = RHF.useWatch({
    control: methods.control,
    name: "fileName",
  });

  // Helper to get extension from file
  const getExtension = (fileName: string): string | null => {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return null;
    return fileName.substring(lastDotIndex + 1).toLowerCase();
  };

  // Auto-suggest fileName from first file if not set
  useEffect(() => {
    if (!currentFileName && selectedFiles && selectedFiles.length > 0) {
      const firstFile = selectedFiles[0];
      if (firstFile) {
        const extension = getExtension(firstFile.name);
        const baseName = extension
          ? firstFile.name.substring(0, firstFile.name.lastIndexOf("."))
          : firstFile.name;
        methods.setValue("fileName", baseName);
      }
    }
  }, [selectedFiles, currentFileName, methods]);

  const handleRegularUpload = async (
    files: File[],
    altText?: string,
    fileName?: string,
  ) => {
    setIsCompressing(true);
    try {
      // Compress images
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith("image/")) {
            return await compressImageToWebP(file, {
              maxSizeMB: 2,
              maxWidthOrHeight: 1920,
              quality: 1,
              convertToWebP: true,
            });
          }
          return file;
        }),
      );

      // Perform Upload
      const result = await createMedia.mutateAsync({
        files: processedFiles,
        altText,
        fileName,
      });

      const items = result?.items || (Array.isArray(result) ? result : []);
      if (items.length > 0) {
        methods.reset();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleChunkUpload = async (
    file: File,
    altText?: string,
    fileName?: string,
  ) => {
    setIsChunkUploading(true);
    setChunkProgress(null);
    setChunkError(null);

    try {
      const uploader = new ChunkUploadManager(file, {
        onProgress: (progress) => setChunkProgress(progress),
        onError: (error) => {
          setChunkError(error);
          console.error("Chunk upload error:", error);
        },
        onSuccess: (result) => {
          console.log("Chunk upload result:", result);
          // Assume result contains the created media object or ID
          // If result.id exists, use it.
          const id = (result as any).uploadId;
          if (id) {
            onUploadComplete?.([id]);
            toast.success("ອັບໂຫຼດສື່ສຳເລັດ");
            methods.reset();
            onOpenChange(false);
          } else {
            console.error("Chunk upload succeeded but no ID returned");
          }
        },
      });

      await uploader.start();
    } catch (error) {
      console.error("Chunk upload failed:", error);
      setChunkError({
        type: "chunk_error",
        message: error instanceof Error ? error.message : "Upload failed",
        recoverable: false,
      });
    } finally {
      setIsChunkUploading(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="ອັບໂຫຼດສື່" size="md">
        <FormRoot<MediaUploadFormValues>
          methods={methods}
          onSubmit={async (vals) => {
            // Check if any files should use chunk upload (files > 10MB)
            const hasLargeFiles = vals.files.some((file) =>
              shouldUseChunkUpload(file),
            );

            if (hasLargeFiles && vals.files.length === 1) {
              // Use chunk upload for single large file
              await handleChunkUpload(
                vals.files[0]!,
                vals.altText,
                vals.fileName,
              );
            } else {
              await handleRegularUpload(
                vals.files,
                vals.altText,
                vals.fileName,
              );
            }
          }}
          className="space-y-4"
        >
          <Field
            name="files"
            label="ຟາຍ"
            hint={
              selectedFiles?.some((file) => shouldUseChunkUpload(file))
                ? "ຟາຍໃຫຍ່ (>10MB) ຈະໃຊ້ການອັບໂຫຼດເປັນ chunks ອັດຕະໂນມັດ"
                : "ສາມາດເລືອກຫຼາຍຟາຍ"
            }
            requiredMark
          >
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                methods.setValue("files", files);
              }}
              className="file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground file:text-sm hover:file:bg-primary/90"
            />
          </Field>
          <FormInput
            name="fileName"
            label="ຊື່ຟາຍ"
            placeholder="ຊື່ຟາຍ (ບໍ່ຕ້ອງໃສ່ extension)"
            hint={
              selectedFiles && selectedFiles.length > 1
                ? "ຖ້າອັບໂຫຼດຫຼາຍຟາຍ ຈະເພີ່ມ _1, _2, ... ອັດຕະໂນມັດ"
                : "Extension ຈະຖືກຄົງໄວ້ອັດຕະໂນມັດ"
            }
          />
          <FormInput
            name="altText"
            label="Alt Text"
            placeholder="ຄຳອະທິບາຍຮູບພາບ (ຈະນຳໃຊ້ກັບທຸກຟາຍ)"
          />

          {/* Chunk upload progress */}
          {isChunkUploading && chunkProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ກຳລັງອັບໂຫຼດຟາຍໃຫຍ່...</span>
                <span>{chunkProgress.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={chunkProgress.percentage} className="w-full" />
              <div className="text-muted-foreground text-xs">
                Chunk {chunkProgress.currentChunk} / {chunkProgress.totalChunks}
                {chunkProgress.speed && (
                  <span className="ml-2">
                    ({(chunkProgress.speed / 1024 / 1024).toFixed(1)} MB/s)
                  </span>
                )}
                {chunkProgress.eta && (
                  <span className="ml-2">
                    ETA: {Math.ceil(chunkProgress.eta / 60)}m{" "}
                    {Math.ceil(chunkProgress.eta % 60)}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error display */}
          {chunkError && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-destructive text-sm">
                ເກີດຄວາມຜິດພາດໃນການອັບໂຫຼດ: {chunkError.message}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isChunkUploading}
            >
              ຍົກເລີກ
            </Button>
            <Button
              type="submit"
              isLoading={submitting || isCompressing || isChunkUploading}
              disabled={isChunkUploading}
            >
              {isCompressing
                ? "ກຳລັງປະມວນຜົນ..."
                : isChunkUploading
                  ? "ກຳລັງອັບໂຫຼດ..."
                  : selectedFiles?.some((file) => shouldUseChunkUpload(file))
                    ? "ອັບໂຫຼດຟາຍໃຫຍ່"
                    : "ອັບໂຫຼດ"}
            </Button>
          </div>
        </FormRoot>
    </Modal>
  );
}
