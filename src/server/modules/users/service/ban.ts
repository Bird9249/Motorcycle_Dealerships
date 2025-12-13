import { getAuditContext } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import { makeService } from "@/server/shared/service";
import { banUser as banUserDb } from "../repo/user-ban";

export const banUserService = makeService<
  {
    id: string;
    reason?: string;
    expires?: Date | null;
  },
  { ok: true }
>({
  name: "userBan",
  run: async (client, { id, reason, expires }) => {
    await banUserDb(id, reason ?? "", expires ?? null, client);
    return { ok: true } as const;
  },
  onSuccess: async ({ client, input, ctx }) => {
    if (!ctx) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.BAN",
        entityType: "user",
        entityId: input.id,
        result: "success",
        ...getAuditContext(ctx),
      },
    ]);
  },
});
