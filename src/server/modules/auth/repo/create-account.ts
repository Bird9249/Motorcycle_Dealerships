import type { DbClient } from "@/server/platform/db/client";
import { account } from "@/server/platform/db/schema/auth";
import type { DbTransaction } from "@/server/shared/types";
import { randomUUIDv7 } from "bun";

export async function createCredentialAccount(
  params: { userId: string; passwordHash: string; now?: string },
  client: DbTransaction | DbClient,
): Promise<void> {
  const now = params.now ?? new Date().toISOString();
  await client.insert(account).values({
    id: randomUUIDv7(),
    accountId: params.userId,
    providerId: "credential",
    userId: params.userId,
    password: params.passwordHash,
    createdAt: now,
    updatedAt: now,
  });
}
