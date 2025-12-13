import type { DbClient } from "@/server/platform/db/client";
import { userRole } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  client: DbTransaction | DbClient,
): Promise<void> {
  await client
    .insert(userRole)
    .values({ userId, roleId })
    .onConflictDoNothing();
}
