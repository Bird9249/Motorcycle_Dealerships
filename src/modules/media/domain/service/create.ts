import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { bunFileStorage } from "@/shared/files/bun-storage";
import { formatNow } from "@/shared/lib/date-time";
import { makeService } from "@/shared/service";
import { createMedia } from "../repo/create";

export const createMediaService = makeService<
  {
    files: File[];
    altText?: string | null;
    fileName?: string | null;
    createdBy?: string | null;
  },
  Array<{ id: string }>
>({
  name: "mediaCreate",
  run: async (client, { files, altText, fileName, createdBy }) => {
    const now = formatNow();
    const results: Array<{ id: string }> = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (file && file.size === 0) continue;

      const saved = await bunFileStorage.save(file!, "uploads/media");
      const mimeType = file?.type || null;
      const isImage = mimeType?.startsWith("image/") ?? false;

      // Determine final fileName
      let finalFileName: string | null = null;
      if (fileName && fileName.trim()) {
        const baseName = fileName.trim();
        // Get extension from original file
        const originalExtension =
          file?.name.split(".").pop()?.toLowerCase() || null;

        if (originalExtension) {
          // If multiple files, add index suffix
          if (files.length > 1) {
            finalFileName = `${baseName}_${index + 1}.${originalExtension}`;
          } else {
            finalFileName = `${baseName}.${originalExtension}`;
          }
        } else {
          // No extension in original file, use mimeType or base name
          if (files.length > 1) {
            finalFileName = `${baseName}_${index + 1}`;
          } else {
            finalFileName = baseName;
          }
        }
      } else {
        // Use original file name
        finalFileName = file?.name || null;
      }

      const media = await createMedia(
        {
          fileUrl: saved.url,
          altText: altText ?? null,
          mimeType,
          fileName: finalFileName,
          fileSize: file?.size,
          width: null,
          height: null,
          createdBy,
          archived: false,
          createdAt: now,
          updatedAt: now,
        },
        client,
      );

      results.push({ id: media?.id ?? "" });
    }

    return results;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx) return;
    await appendAudit(
      client,
      output.map((item) => ({
        occurredAt: formatNow(),
        action: "MEDIA.CREATE",
        entityType: "media",
        entityId: item.id,
        result: "success",
        after: { id: item.id },
        ...getAuditContext(ctx),
      })),
    );
  },
});
