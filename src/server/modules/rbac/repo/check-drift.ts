import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import { ALL_PERMISSIONS } from "@/server/shared/contracts/permissions";
import type { DbTransaction } from "@/server/shared/types";

export async function checkDrift(
  client: DbTransaction | DbClient,
): Promise<{ missingInDb: string[]; extraInDb: string[] }> {
  const rows = await client.select().from(role);
  const dbIds = new Set<string>();
  for (const r of rows)
    for (const id of (r.permissions as string[]) ?? []) dbIds.add(id);
  const codeIds = new Set<string>(ALL_PERMISSIONS.map((p) => p.id));
  const missingInDb: string[] = [];
  for (const id of codeIds) if (!dbIds.has(id)) missingInDb.push(id);
  const extraInDb: string[] = [];
  for (const id of dbIds) if (!codeIds.has(id)) extraInDb.push(id);
  return { missingInDb, extraInDb };
}
