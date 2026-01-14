import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Schema for pg-transactional-outbox
// This matches the schema expected by pg-transactional-outbox library
export const outbox = pgTable(
  "outbox",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    messageType: text("message_type").notNull(),
    segment: text("segment"),
    concurrency: text("concurrency").notNull().default("sequential"),
    payload: jsonb("payload").notNull(),
    metadata: jsonb("metadata"),
    lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`to_timestamp(0)`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`clock_timestamp()`),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "date",
    }),
    abandonedAt: timestamp("abandoned_at", {
      withTimezone: true,
      mode: "date",
    }),
    startedAttempts: smallint("started_attempts").notNull().default(0),
    finishedAttempts: smallint("finished_attempts").notNull().default(0),
  },
  (t) => [
    index("outbox_aggregate_type_aggregate_id").on(
      t.aggregateType,
      t.aggregateId,
    ),
    index("outbox_created_at").on(t.createdAt),
    index("outbox_processed_at").on(t.processedAt),
    index("outbox_locked_until").on(t.lockedUntil),
  ],
);
