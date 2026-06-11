import { Controller, useFormContext } from "react-hook-form";
import { resolveImageSrc } from "@/shared/ui/AppImage";
import { AvatarDeferredUpload } from "@/shared/ui/AvatarDeferredUpload";

type Props = {
  imageName?: string;
  fileName?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

export function FormAvatarUpload({
  imageName = "image",
  fileName = "imageFile",
  label,
  hint,
  disabled,
  className,
}: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={imageName}
      control={control}
      render={({ field: imageField }) => (
        <Controller
          name={fileName}
          control={control}
          render={({ field: fileField }) => (
            <AvatarDeferredUpload
              className={className}
              disabled={disabled}
              label={label}
              hint={hint}
              value={
                imageField.value
                  ? resolveImageSrc(imageField.value as string)
                  : undefined
              }
              imageFile={
                (fileField.value as File | null | undefined) ?? undefined
              }
              onChange={imageField.onChange}
              onFileSelect={fileField.onChange}
            />
          )}
        />
      )}
    />
  );
}
