import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    requestId: text("request_id"),
    traceId: text("trace_id"),
    tenantId: text("tenant_id"),
    actorId: text("actor_id"),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    result: text("result").default("success"),
    error: text("error"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    path: text("path"),
    method: text("method"),
    before: jsonb("before"),
    after: jsonb("after"),
    meta: jsonb("meta"),
    prevHash: text("prev_hash"),
    hash: text("hash"),
  },
  (t) => [
    index("audit_logs_by_time").on(t.occurredAt),
    index("audit_logs_by_tenant_time").on(t.tenantId, t.occurredAt),
    index("audit_logs_by_entity").on(t.entityType, t.entityId),
    index("audit_logs_by_action").on(t.action),
  ],
);
