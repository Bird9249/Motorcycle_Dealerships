import { Loader2, Upload } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { Button } from "@/components/kit";
import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "file";
}

export type PresignedFileUploadProps = {
  /** Prefix ของ key ใน bucket เช่น "uploads/demo" */
  keyPrefix?: string;
  /** accept attribute ของ input เช่น "image/*" */
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

export function PresignedFileUpload({
  keyPrefix = "uploads",
  accept,
  onSuccess,
  onError,
  buttonLabel = "อัปโหลดไฟล์",
  hint,
  className,
}: PresignedFileUploadProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const ext = file.name.includes(".")
          ? (file.name.split(".").pop() ?? "")
          : "";
        const baseName = file.name.includes(".")
          ? file.name.slice(0, file.name.lastIndexOf("."))
          : file.name;
        const safeBase = sanitizeFilename(baseName);
        const key = `${keyPrefix}/${Date.now()}-${safeBase}${ext ? `.${ext}` : ""}`;
        const contentType = file.type || undefined;

        const { uploadUrl } = await uploadApi.getPresignUrl({
          key,
          contentType,
        });

        await uploadFileToPresignedUrl(uploadUrl, file, { contentType });
        setLastKey(key);
        onSuccess?.(key);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message);
        onError?.(err);
      } finally {
        setUploading(false);
      }
    },
    [keyPrefix, onSuccess, onError],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

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
            {uploading ? "ກຳລັງອັບໂຫຼດ..." : buttonLabel}
          </span>
        </Button>
      </div>
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
