import type { HonoContext } from "@/server/shared/types";
import type { Context } from "hono";
import type { AuditEvent, AuditResult } from "../audit.types";

export function buildAuditEvent(
  c: Context<HonoContext>,
  params: {
    action: string;
    entityType?: string;
    entityId?: string | number;
    result?: AuditResult;
    before?: unknown;
    after?: unknown;
    error?: string;
  },
): AuditEvent {
  return {
    occurredAt: new Date().toISOString(),
    ...getAuditContext(c),
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    result: params.result,
    error: params.error,
    before: params.before,
    after: params.after,
  };
}

export function getAuditContext(c: Context<HonoContext>): Partial<AuditEvent> {
  return {
    requestId: c.get("requestId"),
    traceId: c.get("traceId"),
    tenantId: c.get("tenantId"),
    actorId: c.get("actorId"),
    actorRole: c.get("actorRole"),
    ip: c.get("ip"),
    userAgent: c.get("userAgent"),
    path: c.req.path,
    method: c.req.method,
  };
}
