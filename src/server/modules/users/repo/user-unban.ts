import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

export async function unbanUser(
  id: string,
  client: DbTransaction,
): Promise<void> {
  const now = new Date().toISOString();
  await client
    .update(schema.user)
    .set({ banned: false, banReason: null, banExpires: null, updatedAt: now })
    .where(eq(schema.user.id, id));
}
