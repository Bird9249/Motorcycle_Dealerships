import { ImageKeyUploadField } from "@/shared/ui/ImageKeyUploadField";

type SlipUploaderProps = {
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  required?: boolean;
};

export function SlipUploader({
  value,
  onChange,
  disabled,
  required,
}: SlipUploaderProps) {
  return (
    <ImageKeyUploadField
      value={value}
      onChange={onChange}
      keyPrefix="uploads/payments"
      label={required ? "ສລິບການໂອນ *" : "ສລິບ (ຖ້າມີ)"}
      aspectHint="ຮູບສລິບ BCEL One / ແອັບທະນາຄານ"
      aspectRatio="aspect-[3/4]"
      disabled={disabled}
    />
  );
}
