import { Button, FormInput, FormRoot, RHF, zodResolver } from "@devhop/ui";
import { z } from "zod";

const MediaFormSchema = z.object({
  altText: z.string().optional(),
  fileName: z.string().optional(),
});

export type MediaFormValues = z.infer<typeof MediaFormSchema>;

// Helper function to extract filename without extension
function getFileNameWithoutExtension(
  fileName: string | null | undefined,
): string {
  if (!fileName) return "";
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return fileName;
  return fileName.substring(0, lastDotIndex);
}

// Helper function to get extension from fileName
function getExtension(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return null;
  return fileName.substring(lastDotIndex + 1).toLowerCase();
}

export function MediaForm({
  initialValues,
  onSubmit,
  submitting,
}: {
  initialValues?: { altText?: string | null; fileName?: string | null };
  onSubmit: (values: {
    altText?: string | null;
    fileName?: string | null;
    file?: File | null;
  }) => void;
  submitting?: boolean;
}) {
  const originalFileName = initialValues?.fileName ?? null;
  const originalExtension = getExtension(originalFileName);

  const methods = RHF.useForm<MediaFormValues>({
    resolver: zodResolver(MediaFormSchema),
    defaultValues: {
      altText: initialValues?.altText ?? "",
      fileName: getFileNameWithoutExtension(originalFileName),
    },
  });

  return (
    <FormRoot<MediaFormValues>
      methods={methods}
      onSubmit={async (vals) => {
        // Only allow editing altText and fileName - no file replacement
        let finalFileName: string | null = null;
        if (vals.fileName !== undefined && vals.fileName.trim() !== "") {
          const newName = vals.fileName.trim();
          if (originalExtension) {
            finalFileName = `${newName}.${originalExtension}`;
          } else {
            finalFileName = newName;
          }
        } else if (originalFileName) {
          // Keep original if no new name provided
          finalFileName = originalFileName;
        }

        onSubmit({
          altText: vals.altText || null,
          fileName: finalFileName,
          file: null, // No file replacement allowed
        });
      }}
      className="space-y-4"
    >
      <FormInput name="altText" label="Alt Text" placeholder="ຄຳອະທິບາຍຮູບພາບ" />
      <FormInput
        name="fileName"
        label="ຊື່ຟາຍ"
        placeholder="ຊື່ຟາຍ (ບໍ່ຕ້ອງໃສ່ extension)"
        hint={
          originalExtension
            ? `Extension: .${originalExtension} (ຈະຖືກຄົງໄວ້ອັດຕະໂນມັດ)`
            : undefined
        }
      />
      {/* File replacement disabled - only altText and fileName can be edited */}
      {/* <Field
        name="file"
        label="ແທນທີ່ຟາຍ"
        hint={(() => {
          const selectedFile = methods.watch("file");
          return selectedFile && shouldUseChunkUpload(selectedFile)
            ? "ຟາຍໃຫຍ່ (>10MB) ຈະໃຊ້ການອັບໂຫຼດເປັນ chunks ອັດຕະໂນມັດ"
            : "ອັບໂຫຼດຟາຍໃໝ່ (ທາງເລືອກ)";
        })()}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={isChunkUploading}
          onChange={(e) => {
            methods.setValue("file", e.target.files?.[0] ?? null);
          }}
          className="file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground file:text-sm hover:file:bg-primary/90 disabled:opacity-50"
        />
      </Field> */}

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={submitting}>
          ເກັບໄວ້
        </Button>
      </div>
    </FormRoot>
  );
}
