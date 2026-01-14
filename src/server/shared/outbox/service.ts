import type {
  GeneralMessageHandler,
  StoredTransactionalMessage,
} from "pg-transactional-outbox";
import { initializePollingMessageListener } from "pg-transactional-outbox";
import { logger, outboxConfig } from "./config";

// Initialize outbox service with message handler
export function createOutboxService(
  messageHandler: (message: StoredTransactionalMessage) => Promise<void>,
) {
  const handler: GeneralMessageHandler = {
    handle: messageHandler,
  };

  const [shutdown] = initializePollingMessageListener(
    outboxConfig,
    handler,
    logger,
  );

  return {
    shutdown,
  };
}
