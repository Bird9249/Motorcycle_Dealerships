import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

export async function deleteRole(
  id: string,
  client: DbTransaction | DbClient,
): Promise<void> {
  await client.delete(role).where(eq(role.id, id));
}
