import { getAuditContext } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import type { RoleUpdateInput } from "../contracts";
import { makeService } from "@/server/shared/service";
import { getRoleById } from "../repo/get-role-by-id";
import { updateRole as updateRoleDb } from "../repo/update-role";

export const updateRoleService = makeService<
  { id: string; input: RoleUpdateInput },
  { id: string }
>({
  name: "updateRole",
  run: async (client, { id, input }) => {
    const after = await updateRoleDb(id, input, client);
    return after;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx) return;
    const before = await getRoleById(input.id, client);
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "RBAC.ROLE.UPDATE",
        entityType: "role",
        entityId: input.id,
        result: "success",
        before: before ?? undefined,
        after: output,
        ...getAuditContext(ctx),
      },
    ]);
  },
});
