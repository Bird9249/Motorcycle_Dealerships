import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

export async function removeUser(id: string, client: DbTransaction) {
  const rows = await client
    .delete(schema.user)
    .where(eq(schema.user.id, id))
    .returning({ id: schema.user.id, image: schema.user.image });
  return rows.length > 0 ? rows[0] : null;
}
