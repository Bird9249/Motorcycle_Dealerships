import type { TransactionalMessage } from "pg-transactional-outbox";
import { initializeMessageStorage } from "pg-transactional-outbox";
import { logger, outboxConfig } from "./config";

// Create message storage function for outbox
// This function must be called within a pg Client transaction
export const storeOutboxMessage = initializeMessageStorage(
  {
    settings: outboxConfig.settings,
    outboxOrInbox: "outbox",
  },
  logger,
);

// Helper to create a TransactionalMessage for audit events
export function createAuditMessage(
  aggregateId: string,
  payload: unknown,
): TransactionalMessage {
  return {
    id: aggregateId,
    aggregateType: "audit",
    aggregateId,
    messageType: "AuditEvent",
    payload,
    concurrency: "sequential",
  };
}
