import type { MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";

export const requireAuditPermission = (): MiddlewareHandler => {
  return async (_c, next) => {
    return next();
  };
};

import { randomUUIDv7 } from "bun";
// Trace/context middleware for audit enrichment (HTTP layer only)
// Flow:
// 1) Auth middleware (platform/http/server.ts) sets `user`, `session`, `permissions`.
// 2) This middleware attaches request-scoped fields: requestId/traceId, ip, userAgent,
//    and mirrors tenantId/actorId/actorRole if provided by auth/session.
// 3) Routes and use-cases can read from context when composing AuditEvent.
//
// Notes:
// - Do NOT attach sensitive data into the context or logs (e.g., tokens, passwords).
// - This file lives in HTTP infra; it must not import from app/domain layers.
// - Other modules should read these values and include them in AuditEvent before sending to the sink.
import type { HonoContext } from "@/server/shared/types";

export const auditContextMiddleware = (): MiddlewareHandler<HonoContext> => {
  return async (c, next) => {
    const req = c.req;

    // Prefer incoming headers if provided by upstream (gateway/proxy)
    const incomingRequestId = req.header("x-request-id");
    const incomingTraceId =
      req.header("x-trace-id") || req.header("traceparent");

    const connInfo = getConnInfo(c);
    const ipHeader = connInfo.remote.address;
    const userAgent = req.header("user-agent") || undefined;

    const requestId = incomingRequestId || randomUUIDv7();
    const traceId = incomingTraceId || requestId;

    // Mirror identity/tenant info from what auth middleware already set
    const session = c.get("session");
    const user = c.get("user");
    const tenantId = (session as unknown as { tenantId?: string } | null)
      ?.tenantId;
    const actorId = user?.id;
    const actorRole = user?.role;

    c.set("requestId", requestId);
    c.set("traceId", traceId);
    c.set("ip", ipHeader);
    c.set("userAgent", userAgent);
    if (tenantId) c.set("tenantId", tenantId);
    if (actorId) c.set("actorId", actorId);
    if (actorRole) c.set("actorRole", actorRole);

    return next();
  };
};

// Usage:
// - Register globally (recommended) after auth middleware in platform/http/server.ts:
//     app.use("*", auditContextMiddleware());
// - In routes/use-cases, read via Hono context:
//     const ctx = c.get("requestId"), c.get("traceId"), c.get("ip"), c.get("userAgent");
//     const tenantId = c.get("tenantId"); const actorId = c.get("actorId"); const actorRole = c.get("actorRole");
// - When emitting AuditEvent in use-cases, include the above values appropriately.
