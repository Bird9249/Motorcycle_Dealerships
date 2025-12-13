import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const outboxStatus = pgEnum("outbox_status", [
  "pending",
  "processing",
  "done",
  "dead",
]);

export const outbox = pgTable(
  "outbox",
  {
    id: text("id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false, mode: "string" })
      .notNull()
      .default(sql`now()`),
    topic: text("topic").notNull().default("general"),
    payload: jsonb("payload").notNull(),
    status: outboxStatus("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", {
      withTimezone: false,
      mode: "string",
    }),
  },
  (t) => [
    primaryKey({ columns: [t.createdAt, t.id], name: "outbox_pk_created_id" }),
    index("outbox_by_status").on(t.status),
    index("outbox_by_topic_status").on(t.topic, t.status),
    index("outbox_by_attempt").on(t.nextAttemptAt),
    index("outbox_by_id").on(t.id),
  ],
);
