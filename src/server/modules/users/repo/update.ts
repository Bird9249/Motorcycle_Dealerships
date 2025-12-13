import { bcryptLikeHasher } from "@/server/modules/auth/services";
import { schema } from "@/server/platform/db/client";
import { userRole } from "@/server/platform/db/schema/rbac";
import type { DbTransaction } from "@/server/shared/types";
import { randomUUIDv7 } from "bun";
import { eq, eq as opEq } from "drizzle-orm";
import type { UpdateUserDTO } from "../contracts";

type UserRow = typeof schema.user.$inferSelect;

export async function updateUser(
  id: string,
  input: UpdateUserDTO,
  client: DbTransaction,
) {
  const now = new Date().toISOString();
  const values: Partial<UserRow> & { updatedAt: string } = {
    updatedAt: now,
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
  };
  const tx = client;
  const [updated] = await tx
    .update(schema.user)
    .set(values)
    .where(eq(schema.user.id, id))
    .returning();
  if (!updated) return null;

  if (input.password) {
    const passwordHash = await bcryptLikeHasher.hash(input.password);
    const existingAccounts = (await tx
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, id))) as Array<
      typeof schema.account.$inferSelect
    >;
    if (existingAccounts.length > 0) {
      const emailAccount = existingAccounts.find(
        (a) => a.providerId === "credential",
      );
      if (emailAccount) {
        await tx
          .update(schema.account)
          .set({ password: passwordHash, updatedAt: now })
          .where(eq(schema.account.id, emailAccount.id));
      } else {
        await tx.insert(schema.account).values({
          id: randomUUIDv7(),
          accountId: id,
          providerId: "credential",
          userId: id,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      await tx.insert(schema.account).values({
        id: randomUUIDv7(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (input.roleId) {
    // Replace existing roles with the provided one (single role assignment semantics)
    await tx.delete(userRole).where(opEq(userRole.userId, id));
    await tx
      .insert(userRole)
      .values({ userId: id, roleId: input.roleId })
      .onConflictDoNothing();
  }

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name ?? null,
    image: updated.image ?? null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    phoneNumber: updated.phoneNumber ?? null,
    banned: updated.banned ?? false,
    banReason: updated.banReason ?? null,
    banExpires: updated.banExpires ? new Date(updated.banExpires) : null,
  };
}
