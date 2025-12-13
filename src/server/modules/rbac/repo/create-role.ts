import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";

export async function createRole(
  data: typeof role.$inferInsert,
  client: DbTransaction | DbClient,
) {
  const [row] = await client
    .insert(role)
    .values({ ...data })
    .onConflictDoNothing()
    .returning();
  return row;
}
