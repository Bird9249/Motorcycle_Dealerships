import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";
import { Button } from "@devhop/ui";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { AppImage } from "./AppImage";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "avatar";
}

export type AvatarPresignedUploadProps = {
  /** Key ใน MinIO ที่เก็บอยู่แล้ว (สำหรับแสดงรูป) */
  value?: string | null;
  /** เมื่ออัปโหลดสำเร็จหรือลบรูป */
  onChange?: (key: string | null) => void;
  keyPrefix?: string;
  /** ป้ายชื่อ */
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

export function AvatarPresignedUpload({
  value,
  onChange,
  keyPrefix = "uploads/avatars",
  label = "ຮູບໂປຣໄຟລ໌",
  hint = "ອັບໂຫຼດຮູບໃໝ່",
  disabled,
  className,
}: AvatarPresignedUploadProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const ext = file.name.includes(".")
          ? (file.name.split(".").pop() ?? "").toLowerCase()
          : "";
        const safeExt = /^(jpe?g|png|gif|webp)$/.test(ext) ? ext : "jpg";
        const key = `${keyPrefix}/${Date.now()}-${sanitizeFilename(file.name.replace(/\.[^.]+$/, "") || "avatar")}.${safeExt}`;
        const contentType = file.type || `image/${safeExt}`;

        const { uploadUrl } = await uploadApi.getPresignUrl({
          key,
          contentType,
        });
        await uploadFileToPresignedUrl(uploadUrl, file, { contentType });
        onChange?.(key);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    [keyPrefix, onChange],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    setError(null);
    onChange?.(null);
  }, [onChange]);

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label && <div className="mb-2 block text-sm font-medium">{label}</div>}
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border bg-muted">
          <AppImage
            src={value ?? undefined}
            alt=""
            className="size-full"
            fit="cover"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={onInputChange}
              disabled={disabled || uploading}
              className="hidden"
              id={inputId}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="ml-2">
                {uploading ? "ກຳລັງອັບໂຫຼດ..." : "ອັບໂຫຼດຮູບ"}
              </span>
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploading}
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2">ລຶບຮູບ</span>
              </Button>
            )}
          </div>
          {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
