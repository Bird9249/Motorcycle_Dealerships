import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { formatNow } from "@/shared/lib/date-time";
import { makeService } from "@/shared/service";
import { archiveMedia } from "../repo/archive";
import { getMediaById } from "../repo/get-by-id";

export const archiveMediaService = makeService<
  { id: string; userId?: string; permissions?: string[] },
  boolean
>({
  name: "mediaArchive",
  run: async (client, { id, userId, permissions }) => {
    const existing = await getMediaById(
      id,
      client,
      userId,
      permissions as PermissionId[],
    );
    if (!existing) return false;

    const ok = await archiveMedia(id, client);
    return ok;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx || !output) return;
    await appendAudit(client, [
      {
        occurredAt: formatNow(),
        action: "MEDIA.ARCHIVE",
        entityType: "media",
        entityId: input.id,
        result: "success",
        ...getAuditContext(ctx),
      },
    ]);
  },
});
