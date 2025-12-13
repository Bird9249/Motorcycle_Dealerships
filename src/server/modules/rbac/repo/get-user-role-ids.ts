import type { DbClient } from "@/server/platform/db/client";
import { userRole } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

export async function getUserRoleIds(
  userId: string,
  client: DbTransaction | DbClient,
): Promise<string[]> {
  const rows = await client
    .select({ roleId: userRole.roleId })
    .from(userRole)
    .where(eq(userRole.userId, userId));
  return rows.map((r) => r.roleId);
}
