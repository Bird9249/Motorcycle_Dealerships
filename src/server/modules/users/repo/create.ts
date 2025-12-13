import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import { randomUUIDv7 } from "bun";

type UserRow = typeof schema.user.$inferSelect;

export async function createUser(
  input: typeof schema.user.$inferInsert,
  client: DbTransaction,
) {
  const tx = client ?? txShim();
  const [userRow] = (await tx
    .insert(schema.user)
    .values({ id: input.id ?? randomUUIDv7(), ...input })
    .returning()) as unknown as UserRow[];
  return userRow;
}

function txShim(): DbTransaction {
  throw new Error("DbTransaction required: bind users repo to request tx");
}
