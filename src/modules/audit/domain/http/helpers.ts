import { nowISO } from "@/shared/lib/date-time";
import type { AuditEvent, AuditResult } from "../audit.types";

export interface AuditRequestContext {
  requestId?: string;
  traceId?: string;
  ip?: string;
  userAgent?: string;
  tenantId?: string;
  actorId?: string;
  actorRole?: string;
  path: string;
  method: string;
}

export function buildAuditEvent(
  ctx: AuditRequestContext,
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
    occurredAt: nowISO(),
    requestId: ctx.requestId,
    traceId: ctx.traceId,
    tenantId: ctx.tenantId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    path: ctx.path,
    method: ctx.method,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    result: params.result,
    error: params.error,
    before: params.before,
    after: params.after,
  };
}

export function getAuditContextFromRequest(
  request: Request,
  ctx: {
    requestId?: string;
    traceId?: string;
    ip?: string;
    userAgent?: string;
    tenantId?: string;
    actorId?: string;
    actorRole?: string;
  },
): AuditRequestContext {
  const url = new URL(request.url);
  return {
    requestId: ctx.requestId,
    traceId: ctx.traceId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    tenantId: ctx.tenantId,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    path: url.pathname,
    method: request.method,
  };
}
