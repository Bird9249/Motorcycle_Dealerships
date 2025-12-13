### Shared Outbox Pattern (Generic)

This module provides a generic, reusable implementation of the Outbox pattern that is not tied to the audit domain. Use it from any module that needs reliable, asynchronous processing.

Contents:

- `schema.ts`: `makeOutboxTable(tableName)` factory and `outboxStatus` enum for a JSONB outbox table.
- `publisher.ts`: lightweight append-only publisher helpers to write payloads to an outbox table.
- `worker.ts`: a generic polling worker that reads pending outbox rows, calls your `process` function, and updates status with retry/backoff.
- `types.ts`: basic Outbox typing helpers.

Quick start

1. Define a table for your module

```ts
// e.g. src/modules/payments/infra/db/payment.schema.ts
import { makeOutboxTable } from "@/server/shared/outbox/schema";

export const paymentOutbox = makeOutboxTable("payment_outbox");
```

2. Append to outbox from your use case or adapter

```ts
import { bindOutboxPublisher } from "@/server/shared/outbox/publisher";
import { paymentOutbox } from "./payment.schema";
import { db } from "@/server/platform/db/client";

const publisher = bindOutboxPublisher<{ type: string; data: unknown }>(
  paymentOutbox,
  db
);
await publisher.append([{ type: "PAYMENT.CAPTURED", data: { id: paymentId } }]);
```

3. Run a worker to process the outbox

```ts
import { createOutboxWorker } from "@/server/shared/outbox/worker";
import { paymentOutbox } from "./payment.schema";
import { db } from "@/server/platform/db/client";

const worker = createOutboxWorker(db, {
  table: paymentOutbox,
  batchSize: 100,
  maxRetry: 5,
  backoffMs: 15000,
  async process(tx, rows) {
    // Your side-effects (publish to broker, call downstream, etc.)
    for (const r of rows) {
      // do work with r.payload
    }
    // Return ids you successfully processed
    return rows.map((r) => r.id);
  },
});

worker.start(2000); // or call worker.flushOnce() manually from a scheduler
```

Notes

- Writes are append-only; the worker transitions status `pending → processing → done` or schedules retry/backoff and eventually marks `dead` after `maxRetry`.
- Keep your `process` function idempotent. If something fails mid-batch, the worker increments `retryCount` and reschedules.
- Use the transaction (`tx`) parameter in `process` to couple any read/write you need with the same DB client for consistency.
