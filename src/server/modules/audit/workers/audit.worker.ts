import { db as rootDb } from "@/server/platform/db/client";
import { createOutboxWorker } from "@/server/shared/outbox/worker";
import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { auditLogs } from "../../../platform/db/schema/audit";

export const auditWorker = createOutboxWorker<Record<string, unknown>>(rootDb, {
  topic: "audit",
  async process(tx, rows) {
    // Group key: tenantId + day(occurredAt in UTC)
    const groups = new Map<
      string,
      { id: string; payload: Record<string, unknown> }[]
    >();
    for (const row of rows) {
      const payload = row.payload ?? {};
      const rawOccurredAt =
        (payload["occurredAt"] as string | number | Date | undefined) ??
        new Date();
      let occurredAt = new Date(rawOccurredAt as unknown as string);
      if (rawOccurredAt instanceof Date) occurredAt = new Date(rawOccurredAt);
      if (Number.isFinite(rawOccurredAt))
        occurredAt = new Date(Number(rawOccurredAt));
      if (Number.isNaN(occurredAt.getTime())) occurredAt = new Date();
      const day = occurredAt.toISOString().slice(0, 10);
      const key = `${(payload.tenantId as string | undefined) ?? "_global"}:${day}`;
      const arr = groups.get(key) ?? [];
      arr.push({ id: row.id, payload });
      groups.set(key, arr);
    }

    const computeHash = (payload: unknown, prevHash: string | null): string => {
      const data = `${prevHash ?? "0"}|${JSON.stringify(payload)}`;
      const h = Bun.hash.xxHash64(data);
      return h.toString(16).padStart(16, "0");
    };

    const processedIds: string[] = [];

    for (const [groupKey, items] of groups) {
      const [tenantIdPart, dayPart] = groupKey.split(":");
      const tenantId = tenantIdPart === "_global" ? null : tenantIdPart;
      const dayStart = new Date(`${dayPart}T00:00:00.000Z`);
      const dayEnd = new Date(`${dayPart}T23:59:59.999Z`);

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
      let prevHash: string | null = lastLog[0]?.hash ?? null;

      const logRows = items.map((it) => {
        const payload = it.payload;
        const rawOccurredAt =
          (payload["occurredAt"] as string | number | Date | undefined) ??
          new Date();
        let occurredAt = new Date(rawOccurredAt as unknown as string);
        if (rawOccurredAt instanceof Date) occurredAt = new Date(rawOccurredAt);
        if (Number.isFinite(rawOccurredAt))
          occurredAt = new Date(Number(rawOccurredAt));
        if (Number.isNaN(occurredAt.getTime())) occurredAt = new Date();
        const nextHash = computeHash(payload, prevHash);
        const row = {
          id: it.id,
          occurredAt,
          requestId: (payload.requestId as string | undefined) ?? null,
          traceId: (payload.traceId as string | undefined) ?? null,
          tenantId: (payload.tenantId as string | undefined) ?? null,
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
        prevHash = nextHash;
        return row;
      });

      await tx.insert(auditLogs).values(logRows).onConflictDoNothing();
      processedIds.push(...items.map((i) => i.id));
    }

    return processedIds;
  },
});
