import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";

export async function upsertRole(
  id: string,
  name: string,
  description: string | null,
  permissions: string[],
  client: DbTransaction | DbClient,
): Promise<void> {
  await client
    .insert(role)
    .values({ id, name, description: description ?? null, permissions })
    .onConflictDoUpdate({
      target: role.id,
      set: { name, description: description ?? null, permissions },
    });
}
