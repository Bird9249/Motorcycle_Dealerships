import { env } from "@/server/platform/config";
import type { PollingListenerConfig } from "pg-transactional-outbox";
import { getDefaultLogger } from "pg-transactional-outbox";

export const outboxConfig: PollingListenerConfig = {
  outboxOrInbox: "outbox",
  dbListenerConfig: {
    connectionString: env.DATABASE_URL,
  },
  settings: {
    dbSchema: "public",
    dbTable: "outbox",
    nextMessagesFunctionName: "get_next_outbox_messages",
    nextMessagesBatchSize: 5,
    nextMessagesLockInMs: 5000,
    nextMessagesPollingIntervalInMs: 2000,
    enableMaxAttemptsProtection: true,
    enablePoisonousMessageProtection: true,
  },
};

export const logger = getDefaultLogger("outbox");
