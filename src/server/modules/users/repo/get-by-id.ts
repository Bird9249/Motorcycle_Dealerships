import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";

type UserRow = typeof schema.user.$inferSelect;

export async function getUserById(id: string, client: DbTransaction) {
  const [r] = (await client
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id))) as unknown as UserRow[];
  return r
    ? {
        id: r.id,
        email: r.email,
        phoneNumber: r.phoneNumber ?? null,
        name: r.name ?? null,
        image: r.image ?? null,
        banned: r.banned ?? false,
        banReason: r.banReason ?? null,
        banExpires: r.banExpires ? new Date(r.banExpires) : null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
    : null;
}
