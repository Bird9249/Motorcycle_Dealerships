import { getAuditContext } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import type { RoleCreateInput } from "../contracts";
import { makeService } from "@/server/shared/service";
import { randomUUIDv7 } from "bun";
import { createRole as createRoleDb } from "../repo/create-role";

export const createRoleService = makeService<
  RoleCreateInput,
  {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  }
>({
  name: "createRole",
  run: async (client, input) => {
    const created = await createRoleDb(
      { ...input, id: randomUUIDv7() },
      client,
    );
    return created;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "RBAC.ROLE.CREATE",
        entityType: "role",
        entityId: output.id,
        result: "success",
        after: { ...output, ...input },
        ...getAuditContext(ctx),
      },
    ]);
  },
});
