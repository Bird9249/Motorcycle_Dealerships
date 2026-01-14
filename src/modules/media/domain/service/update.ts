import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { bunFileStorage } from "@/shared/files/bun-storage";
import { formatNow } from "@/shared/lib/date-time";
import { makeService } from "@/shared/service";
import type { UpdateMediaDTO } from "../contracts";
import { getMediaById } from "../repo/get-by-id";
import { updateMedia } from "../repo/update";

export const updateMediaService = makeService<
  {
    id: string;
    input: UpdateMediaDTO;
    file?: File | null;
    userId?: string;
    permissions?: string[];
  },
  { id: string } | null
>({
  name: "mediaUpdate",
  run: async (client, { id, input, file, userId, permissions }) => {
    const existing = await getMediaById(
      id,
      client,
      userId,
      permissions as PermissionId[],
    );
    if (!existing) return null;

    let next: UpdateMediaDTO & {
      fileUrl?: string;
      fileName?: string | null;
      fileSize?: number | null;
    } = { ...input };
    let oldFileToDelete: string | null = null;

    // Handle fileName update - preserve extension if original has one
    if (input.fileName !== undefined) {
      if (input.fileName === null) {
        next.fileName = undefined;
      } else {
        // Preserve extension from original fileName or mimeType
        const originalExtension = existing.fileName
          ? existing.fileName.split(".").pop()?.toLowerCase()
          : null;
        const mimeExtension = existing.mimeType
          ? existing.mimeType.split("/").pop()?.toLowerCase()
          : null;

        let finalFileName = input.fileName.trim();
        if (!finalFileName) {
          next.fileName = existing.fileName ?? undefined;
        } else {
          // Check if new name already has extension
          const newNameParts = finalFileName.split(".");
          const hasExtension = newNameParts.length > 1;

          if (!hasExtension) {
            // Add extension from original or mimeType
            if (originalExtension) {
              finalFileName = `${finalFileName}.${originalExtension}`;
            } else if (mimeExtension && mimeExtension !== "octet-stream") {
              // Map common mime types to extensions
              const mimeToExt: Record<string, string> = {
                jpeg: "jpg",
                "svg+xml": "svg",
              };
              const ext = mimeToExt[mimeExtension] || mimeExtension;
              finalFileName = `${finalFileName}.${ext}`;
            }
          } else {
            // If has extension, check if it matches original
            const newExtension = newNameParts.pop()?.toLowerCase();
            if (originalExtension && newExtension !== originalExtension) {
              // Replace with original extension
              finalFileName = `${newNameParts.join(".")}.${originalExtension}`;
            }
          }
          next.fileName = finalFileName;
        }
      }
    }

    if (file && file.size > 0) {
      const saved = await bunFileStorage.save(file, "uploads/media");

      next = {
        ...next,
        fileUrl: saved.url,
        fileName: file.name || next.fileName || "",
        fileSize: file.size,
      };
      oldFileToDelete = existing.fileUrl;
    }

    const updated = await updateMedia(id, next, client);
    if (updated && oldFileToDelete) {
      await bunFileStorage.deleteByUrl(oldFileToDelete);
    }
    return updated;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx || !output) return;
    const before = await getMediaById(
      input.id,
      client,
      input.userId,
      input.permissions as PermissionId[],
    );
    await appendAudit(client, [
      {
        occurredAt: formatNow(),
        action: "MEDIA.UPDATE",
        entityType: "media",
        entityId: input.id,
        result: "success",
        before: before ?? undefined,
        after: output,
        ...getAuditContext(ctx),
      },
    ]);
  },
});
