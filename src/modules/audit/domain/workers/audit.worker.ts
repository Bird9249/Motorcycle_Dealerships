import { db as rootDb } from "@/server/platform/db/client";
import { auditLogs } from "@/server/platform/db/schema/audit";
import { createOutboxService } from "@/server/shared/outbox/service";
import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import type { StoredTransactionalMessage } from "pg-transactional-outbox";
import type { AuditEvent } from "../audit.types";

// Process a single audit message from outbox
async function processAuditMessage(
  message: StoredTransactionalMessage,
): Promise<void> {
  // Extract payload - pg-transactional-outbox stores payload in message.payload
  const payload = message.payload as AuditEvent;
  const aggregateId = message.aggregateId;

  // Parse occurredAt
  const rawOccurredAt =
    (payload.occurredAt as string | number | Date | undefined) ?? new Date();
  let occurredAt = new Date(rawOccurredAt as unknown as string);
  if (rawOccurredAt instanceof Date) occurredAt = new Date(rawOccurredAt);
  if (Number.isFinite(rawOccurredAt))
    occurredAt = new Date(Number(rawOccurredAt));
  if (Number.isNaN(occurredAt.getTime())) occurredAt = new Date();

  const day = occurredAt.toISOString().slice(0, 10);
  const tenantId = (payload.tenantId as string | undefined) ?? null;
  const dayStart = new Date(`${day}T00:00:00.000Z`);
  const dayEnd = new Date(`${day}T23:59:59.999Z`);

  // Process in transaction
  await rootDb.transaction(async (tx) => {
    // Get last log for hash chain
    const lastLog = await tx
      .select({ hash: auditLogs.hash })
      .from(auditLogs)
      .where(
        and(
          tenantId
            ? eq(auditLogs.tenantId, tenantId)
            : isNull(auditLogs.tenantId),
          gte(auditLogs.occurredAt, dayStart),
          lte(auditLogs.occurredAt, dayEnd),
        ),
      )
      .orderBy(desc(auditLogs.occurredAt))
      .limit(1);

    const prevHash: string | null = lastLog[0]?.hash ?? null;

    // Compute hash
    const computeHash = (payload: unknown, prevHash: string | null): string => {
      const data = `${prevHash ?? "0"}|${JSON.stringify(payload)}`;
      const h = Bun.hash.xxHash64(data);
      return h.toString(16).padStart(16, "0");
    };

    const nextHash = computeHash(payload, prevHash);

    // Insert audit log
    const logRow = {
      id: aggregateId,
      occurredAt,
      requestId: (payload.requestId as string | undefined) ?? null,
      traceId: (payload.traceId as string | undefined) ?? null,
      tenantId,
      actorId: (payload.actorId as string | undefined) ?? null,
      actorRole: (payload.actorRole as string | undefined) ?? null,
      action: String(payload.action),
      entityType: (payload.entityType as string | undefined) ?? null,
      entityId: (payload.entityId as string | undefined) ?? null,
      result: (payload.result as string | undefined) ?? "success",
      error: (payload.error as string | undefined) ?? null,
      ip: (payload.ip as string | undefined) ?? null,
      userAgent: (payload.userAgent as string | undefined) ?? null,
      path: (payload.path as string | undefined) ?? null,
      method: (payload.method as string | undefined) ?? null,
      before: (payload.before as unknown) ?? null,
      after: (payload.after as unknown) ?? null,
      meta: (payload.meta as unknown) ?? null,
      prevHash,
      hash: nextHash,
    };

    await tx.insert(auditLogs).values(logRow).onConflictDoNothing();
  });
}

// Create and export outbox service for audit
export const auditOutboxService = createOutboxService(processAuditMessage);
