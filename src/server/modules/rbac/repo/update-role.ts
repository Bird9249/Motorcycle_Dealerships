import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

type RoleRow = typeof role.$inferSelect;

export async function updateRole(
  id: string,
  data: Partial<typeof role.$inferInsert>,
  client: DbTransaction | DbClient,
): Promise<RoleRow> {
  const [row] = await client
    .update(role)
    .set(data)
    .where(eq(role.id, id))
    .returning();
  return row as RoleRow;
}
