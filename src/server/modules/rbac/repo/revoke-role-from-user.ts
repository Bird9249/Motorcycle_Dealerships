import type { DbClient } from "@/server/platform/db/client";
import { userRole } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { and, eq } from "drizzle-orm";

export async function revokeRoleFromUser(
  userId: string,
  roleId: string,
  client: DbTransaction | DbClient,
): Promise<void> {
  await client
    .delete(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)));
}
