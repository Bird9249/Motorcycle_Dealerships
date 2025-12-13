import type { DbClient } from "@/server/platform/db/client";
import { user } from "@/server/platform/db/schema/auth";
import { userRole } from "@/server/platform/db/schema/rbac";
import { Roles } from "@/server/shared/contracts/roles";
import type { DbTransaction } from "@/server/shared/types";
import { inArray } from "drizzle-orm";
import { upsertRole } from "./upsert-role";

export async function syncFromCode(
  client: DbTransaction | DbClient,
): Promise<void> {
  for (const [roleId, perms] of Object.entries(Roles)) {
    await upsertRole(roleId, roleId, null, perms as string[], client);
  }

  // Sync user-role assignments based on user.role matching role ids from code
  const roleIds = Object.keys(Roles);
  if (roleIds.length > 0) {
    const users = await client
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(inArray(user.role, roleIds));

    if (users.length > 0) {
      const rows = users
        .filter((u) => !!u.role)
        .map((u) => ({ userId: u.id, roleId: u.role as string }));
      if (rows.length > 0) {
        await client.insert(userRole).values(rows).onConflictDoNothing();
      }
    }
  }
}
