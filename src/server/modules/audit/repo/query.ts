import type { DbClient } from "@/server/platform/db/client";
import type {
  OffsetPageDTO,
  OffsetPageQueryDTO,
} from "@/server/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/server/shared/db/query";
import type { DbTransaction } from "@/server/shared/types";
import { desc, sql } from "drizzle-orm";
import { auditLogs } from "../../../platform/db/schema/audit";
import type { AuditEvent } from "../audit.types";

type AuditRow = typeof auditLogs.$inferSelect;

export async function queryAudit(
  params: OffsetPageQueryDTO,
  client: DbTransaction | DbClient,
): Promise<OffsetPageDTO<AuditEvent>> {
  const { limit, offset, sort, filters } = params;

  const columns = {
    id: auditLogs.id,
    occurredAt: auditLogs.occurredAt,
    tenantId: auditLogs.tenantId,
    actorId: auditLogs.actorId,
    actorRole: auditLogs.actorRole,
    action: auditLogs.action,
    entityType: auditLogs.entityType,
    entityId: auditLogs.entityId,
    result: auditLogs.result,
    ip: auditLogs.ip,
    path: auditLogs.path,
    method: auditLogs.method,
    requestId: auditLogs.requestId,
    traceId: auditLogs.traceId,
  } as const;

  const whereExpr = buildWhereGroups(columns, filters ?? []);
  const orderBy = buildOrderBy(columns, sort) ?? [desc(auditLogs.occurredAt)];

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(auditLogs)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const rows = (await client
    .select()
    .from(auditLogs)
    .where(whereExpr)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset)) as unknown as AuditRow[];

  const items: AuditEvent[] = rows.map((r) => ({
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
  }));

  return { data: items, meta: { total, limit, offset } };
}
