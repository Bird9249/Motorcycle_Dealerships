import type { DbClient } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import {
  getPermissionsForRoleIds,
  type PermissionRecord,
} from "../repo/get-permissions-for-role-ids";
import { getUserRoleIds } from "../repo/get-user-role-ids";

type Db = DbTransaction | DbClient;

export async function getEffectivePermissionsService(
  client: Db,
  userId: string,
): Promise<PermissionRecord[]> {
  const roleIds = await getUserRoleIds(userId, client);
  const rolePerms = await getPermissionsForRoleIds(roleIds, client);
  const union = new Map<string, PermissionRecord>();
  for (const p of rolePerms) union.set(p.id, p);
  return [...union.values()];
}
