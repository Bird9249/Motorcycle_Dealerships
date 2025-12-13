import type { DbClient } from "@/server/platform/db/client";
import { outbox } from "@/server/platform/db/schema/outbox";
import { randomUUIDv7 } from "bun";
import type { DbTransaction } from "../types";

export function bindOutboxPublisher<TPayload>(
  client: DbTransaction | DbClient,
) {
  return {
    async append(items: TPayload[], topic = "general"): Promise<void> {
      if (!items || items.length === 0) return;
      const rows = items.map((payload) => ({
        id: randomUUIDv7(),
        topic,
        payload,
      }));
      await client.insert(outbox).values(rows);
    },
  } as const;
}
