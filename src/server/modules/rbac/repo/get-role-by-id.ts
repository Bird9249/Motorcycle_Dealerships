import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

export async function getRoleById(
  id: string,
  client: DbTransaction | DbClient,
) {
  const rows = await client.select().from(role).where(eq(role.id, id));
  return rows[0];
}
