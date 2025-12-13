import { getAuditContext } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import { bunFileStorage } from "@/server/shared/files/bun-storage";
import { makeService } from "@/server/shared/service";
import { removeUser } from "../repo/remove";

export const deleteUserService = makeService<{ id: string }, boolean>({
  name: "userDelete",
  run: async (client, { id }) => {
    const user = await removeUser(id, client);

    if (user?.image) {
      await bunFileStorage.deleteByUrl(user.image);
    }

    return user !== null;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx || !output) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.DELETE",
        entityType: "user",
        entityId: input.id,
        result: "success",
        ...getAuditContext(ctx),
      },
    ]);
  },
});
