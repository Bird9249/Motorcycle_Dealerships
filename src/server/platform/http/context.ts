import { randomUUIDv7 } from "bun";
import { Elysia } from "elysia";
import { auth } from "@/modules/auth/domain/better-auth";
import { db } from "@/server/platform/db/client";
import type { AuthSession, AuthUser } from "@/shared/types";

/**
 * Plugin หลักสำหรับ request context:
 * - db: Drizzle database client
 * - user, session, permissions: จาก better-auth session
 * - requestId, traceId, ip, userAgent: สำหรับ audit logging
 */
export const serverContext = new Elysia({ name: "server-context" })
  .decorate("db", db)
  .derive({ as: "scoped" }, async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    return {
      user: session
        ? ({ role: "user" as string, ...session.user } as AuthUser)
        : (null as AuthUser | null),
      session: (session?.session ?? null) as AuthSession | null,
      permissions: ((session as unknown as { permissions?: string[] } | null)
        ?.permissions ?? []) as string[],
    };
  })
  .derive({ as: "scoped" }, ({ request, server, user, session }) => {
    const incomingRequestId = request.headers.get("x-request-id");
    const incomingTraceId =
      request.headers.get("x-trace-id") || request.headers.get("traceparent");

    const ip = server?.requestIP(request)?.address;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const requestId = incomingRequestId ?? randomUUIDv7();
    const traceId = incomingTraceId ?? requestId;

    const tenantId = (session as unknown as { tenantId?: string } | null)
      ?.tenantId;
    const actorId = user?.id;
    const actorRole = user?.role;

    return {
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    };
  });

export type ServerContext = typeof serverContext;
