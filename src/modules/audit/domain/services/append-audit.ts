import type { DbClient } from "@/server/platform/db/client";
import {
  createAuditMessage,
  storeOutboxMessage,
} from "@/server/shared/outbox/message-storage";
import { getPgClient } from "@/server/shared/outbox/pg-client";
import type { DbTransaction } from "@/shared/types";
import { randomUUIDv7 } from "bun";
import type { AuditEvent } from "../audit.types";
import { auditPolicy } from "./audit.policy.impl";

type Db = DbTransaction | DbClient;

export async function appendAudit(
  client: Db,
  events: AuditEvent[],
): Promise<void> {
  // Apply redaction policy per event then write to outbox within the provided transaction/client
  const redacted = events.map((e) => auditPolicy.redact(e));

  // Get pg Client for outbox operations
  // Note: This requires the pg Client to be in the same transaction
  // For now, we'll use a separate connection which is a limitation
  // In production, you'd want to extract the pg Client from Drizzle transaction
  const pgClient = await getPgClient();

  try {
    // Start transaction on pg client
    await pgClient.query("BEGIN");

    // Store each event in outbox
    for (const event of redacted) {
      const eventId = event.id ?? randomUUIDv7();
      const message = createAuditMessage(eventId, event);
      await storeOutboxMessage(message, pgClient);
    }

    await pgClient.query("COMMIT");
  } catch (error) {
    await pgClient.query("ROLLBACK");
    throw error;
  } finally {
    pgClient.release();
  }
}
