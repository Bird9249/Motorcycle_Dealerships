import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

export async function banUser(
  id: string,
  reason: string,
  expires: Date | null,
  client: DbTransaction,
): Promise<void> {
  const now = new Date().toISOString();
  await client
    .update(schema.user)
    .set({
      banned: true,
      banReason: reason ?? null,
      banExpires: expires ? expires.toISOString() : null,
      updatedAt: now,
    })
    .where(eq(schema.user.id, id));
}
