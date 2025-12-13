import type { DbClient } from "@/server/platform/db/client";
import type { DbTransaction } from "@/server/shared/types";
import { eq } from "drizzle-orm";
import { auditLogs } from "../../../platform/db/schema/audit";
import type { AuditEvent } from "../audit.types";

type AuditRow = typeof auditLogs.$inferSelect;

export async function getAuditById(
  id: string,
  client: DbTransaction | DbClient,
): Promise<AuditEvent | null> {
  const rows = (await client
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.id, id))) as unknown as AuditRow[];

  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    occurredAt: r.occurredAt.toISOString(),
    requestId: r.requestId ?? undefined,
    traceId: r.traceId ?? undefined,
    tenantId: r.tenantId ?? undefined,
    actorId: r.actorId ?? undefined,
    actorRole: r.actorRole ?? undefined,
    action: r.action,
    entityType: r.entityType ?? undefined,
    entityId: r.entityId ?? undefined,
    result: (r.result as AuditEvent["result"]) ?? undefined,
    error: r.error ?? undefined,
    ip: r.ip ?? undefined,
    userAgent: r.userAgent ?? undefined,
    path: r.path ?? undefined,
    method: r.method ?? undefined,
    before: r.before ?? undefined,
    after: r.after ?? undefined,
    meta: (r.meta as Record<string, unknown> | null) ?? undefined,
  } satisfies AuditEvent;
}
