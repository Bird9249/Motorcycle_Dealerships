### Outbox Pattern with pg-transactional-outbox

This module uses `pg-transactional-outbox` library to implement the transactional outbox pattern for reliable, asynchronous message processing.

Contents:

- `config.ts`: Configuration for pg-transactional-outbox service
- `message-storage.ts`: Helpers to store messages in outbox table
- `service.ts`: Outbox service initialization
- `pg-client.ts`: PostgreSQL client pool for outbox operations

Quick start

1. Store messages in outbox from your use case or adapter

```ts
import { storeAuditOutboxMessage } from "@/server/shared/outbox/message-storage";
import { getPgClient } from "@/server/shared/outbox/pg-client";
import type { Client } from "pg";

// Within a transaction
const pgClient = await getPgClient();
try {
  await pgClient.query("BEGIN");
  await storeAuditOutboxMessage(eventId, eventData, pgClient);
  await pgClient.query("COMMIT");
} catch (error) {
  await pgClient.query("ROLLBACK");
  throw error;
} finally {
  pgClient.release();
}
```

2. Initialize outbox service to process messages

```ts
import { createOutboxService } from "@/server/shared/outbox/service";

const outboxService = createOutboxService(async (message) => {
  // Process message.payload
  // pg-transactional-outbox handles retry logic automatically
});

// Shutdown when done
await outboxService.shutdown();
```

Notes

- Messages are stored in the same transaction as business data for atomicity
- pg-transactional-outbox handles retry logic, backoff, and dead letter queue automatically
- The library uses polling (configurable interval) to process pending messages
- Keep your message handler function idempotent
- The library manages status transitions internally
