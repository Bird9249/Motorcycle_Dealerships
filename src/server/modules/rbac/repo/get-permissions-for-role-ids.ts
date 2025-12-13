import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { inArray } from "drizzle-orm";

export type PermissionRecord = {
  id: string;
  resource: string;
  action: string;
};

export async function getPermissionsForRoleIds(
  roleIds: string[],
  client: DbTransaction | DbClient,
): Promise<PermissionRecord[]> {
  if (roleIds.length === 0) return [];
  const rows = await client
    .select()
    .from(role)
    .where(inArray(role.id, roleIds));
  const set = new Map<string, PermissionRecord>();
  for (const r of rows) {
    for (const id of (r.permissions as string[]) ?? []) {
      const [resource, action] = id.split(":");
      set.set(id, { id, resource: resource ?? "", action: action ?? "" });
    }
  }
  return [...set.values()];
}
