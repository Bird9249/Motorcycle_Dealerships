import { Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useMemo } from "react";
import { Button } from "@/components/kit";
import { AppImage } from "./AppImage";

export type AvatarDeferredUploadProps = {
  /** Key ใน MinIO ที่เก็บอยู่แล้ว (สำหรับแสดงรูปเมื่อไม่มี pending file) */
  value?: string | null;
  /** ไฟล์ที่เลือกไว้ รออัปโหลดตอน submit */
  imageFile?: File | null;
  /** เมื่อลบรูป (ส่ง null) */
  onChange?: (key: string | null) => void;
  /** เมื่อผู้ใช้เลือกหรือลบไฟล์ (ยังไม่อัปโหลด) */
  onFileSelect?: (file: File | null) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

export function AvatarDeferredUpload({
  value,
  imageFile,
  onChange,
  onFileSelect,
  label = "ຮູບໂປຣໄຟລ໌",
  hint = "ເລືອກຮູບ ຈະອັບໂຫຼດເມື່ອກົດບັນທຶກ",
  disabled,
  className,
}: AvatarDeferredUploadProps) {
  const inputId = useId();

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      onFileSelect?.(file ?? null);
      e.target.value = "";
    },
    [onFileSelect],
  );

  const handleClear = useCallback(() => {
    onFileSelect?.(null);
    onChange?.(null);
  }, [onChange, onFileSelect]);

  const displaySrc = imageFile ? previewUrl : (value ?? undefined);

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label && <div className="mb-2 block font-medium text-sm">{label}</div>}
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border bg-muted">
          {displaySrc ? (
            <img src={displaySrc} alt="" className="size-full object-cover" />
          ) : (
            <AppImage
              src={undefined}
              alt=""
              className="size-full"
              fit="cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={onInputChange}
              disabled={disabled}
              className="hidden"
              id={inputId}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <Upload className="h-4 w-4" />
              <span className="ml-2">ເລືອກຮູບ</span>
            </Button>
            {(value || imageFile) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2">ລຶບຮູບ</span>
              </Button>
            )}
          </div>
          {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
