import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { formatNow } from "@/shared/lib/date-time";
import { makeService } from "@/shared/service";
import { getMediaById } from "../repo/get-by-id";
import { unarchiveMedia } from "../repo/unarchive";

export const unarchiveMediaService = makeService<
  { id: string; userId?: string; permissions?: string[] },
  boolean
>({
  name: "mediaUnarchive",
  run: async (client, { id, userId, permissions }) => {
    const existing = await getMediaById(
      id,
      client,
      userId,
      permissions as PermissionId[],
    );
    if (!existing) return false;

    const ok = await unarchiveMedia(id, client);
    return ok;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx || !output) return;
    await appendAudit(client, [
      {
        occurredAt: formatNow(),
        action: "MEDIA.UNARCHIVE",
        entityType: "media",
        entityId: input.id,
        result: "success",
        ...getAuditContext(ctx),
      },
    ]);
  },
});
