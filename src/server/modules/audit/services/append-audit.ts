import type { DbClient } from "@/server/platform/db/client";
import { bindOutboxPublisher } from "@/server/shared/outbox/publisher";
import type { DbTransaction } from "@/server/shared/types";
import type { AuditEvent } from "../audit.types";
import { auditPolicy } from "./audit.policy.impl";

type Db = DbTransaction | DbClient;

export async function appendAudit(
  client: Db,
  events: AuditEvent[],
): Promise<void> {
  // Apply redaction policy per event then write to outbox within the provided transaction/client
  const redacted = events.map((e) => auditPolicy.redact(e));
  const publisher = bindOutboxPublisher<AuditEvent>(client);
  await publisher.append(redacted, "audit");
}
