import { Elysia } from "elysia";
import {
  buildAuditEvent,
  getAuditContextFromRequest,
} from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { serverContext } from "@/server/platform/http/context";
import { auth } from "../domain/better-auth";

export const authRoutes = new Elysia()
  .use(serverContext)
  .all(
    "/auth/*",
    async ({
      request,
      db,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      const res = await auth.handler(request);
      try {
        const path = new URL(request.url).pathname;
        const statusCode = res.status;
        const isSuccess = statusCode >= 200 && statusCode < 400;
        let action: string | null = null;
        if (path.includes("sign-in"))
          action = isSuccess ? "AUTH.LOGIN" : "AUTH.LOGIN_FAILED";
        else if (path.includes("sign-out") || path.includes("logout"))
          action = "AUTH.LOGOUT";
        else if (path.includes("sign-up") || path.includes("register"))
          action = isSuccess ? "AUTH.REGISTER" : "AUTH.REGISTER_FAILED";
        else if (path.includes("password") && path.includes("reset"))
          action = isSuccess
            ? "AUTH.PASSWORD.RESET"
            : "AUTH.PASSWORD.RESET_FAILED";
        else if (path.includes("password") && path.includes("forgot"))
          action = isSuccess
            ? "AUTH.PASSWORD.FORGOT"
            : "AUTH.PASSWORD.FORGOT_FAILED";

        if (action) {
          const ctx = getAuditContextFromRequest(request, {
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          });
          await appendAudit(db, [
            buildAuditEvent(ctx, {
              action,
              result: isSuccess ? "success" : "failed",
            }),
          ]);
        }
      } catch {}
      return res;
    },
  );
