import { Loader2, Upload } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { Button } from "@/components/kit";
import {
  DEFAULT_CHUNK_SIZE,
  uploadLargeFileInChunks,
} from "@/shared/lib/chunk-upload-s3";

export type ChunkFileUploadProps = {
  /** Prefix ของ key ใน bucket เช่น "uploads/large" */
  keyPrefix?: string;
  /** ขนาด chunk (bytes), default 5MB */
  chunkSize?: number;
  /** accept attribute ของ input */
  accept?: string;
  /** callback เมื่ออัปโหลดสำเร็จ (ได้ key ใน bucket) */
  onSuccess?: (key: string) => void;
  /** callback เมื่อเกิดข้อผิดพลาด */
  onError?: (error: Error) => void;
  /** ป้ายชื่อปุ่ม */
  buttonLabel?: string;
  /** คำอธิบายสั้น */
  hint?: string;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChunkFileUpload({
  keyPrefix = "uploads/large",
  chunkSize = DEFAULT_CHUNK_SIZE,
  accept,
  onSuccess,
  onError,
  buttonLabel = "ອັບໂຫຼດ file ຂະຫນາດໃຫຍ່ (Chunk)",
  hint,
  className,
}: ChunkFileUploadProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLastKey(null);
      setUploading(true);
      setProgress({ loaded: 0, total: file.size });
      try {
        const key = await uploadLargeFileInChunks(file, {
          keyPrefix,
          chunkSize,
          onProgress: (loaded, total) => setProgress({ loaded, total }),
        });
        setLastKey(key);
        setProgress(null);
        onSuccess?.(key);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message);
        setProgress(null);
        onError?.(err);
      } finally {
        setUploading(false);
      }
    },
    [keyPrefix, chunkSize, onSuccess, onError],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.loaded / progress.total) * 100)
      : 0;

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept={accept}
          onChange={onInputChange}
          disabled={uploading}
          className="hidden"
          id={inputId}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2">
            {uploading ? `ກຳລັງອັບໂຫຼດ... ${progressPercent}%` : buttonLabel}
          </span>
        </Button>
      </div>

      {progress && progress.total > 0 && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
          </p>
        </div>
      )}

      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      {lastKey && (
        <p className="break-all text-muted-foreground text-xs">
          ອັບໂຫຼດແລ້ວ: <code className="rounded bg-muted px-1">{lastKey}</code>
        </p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
