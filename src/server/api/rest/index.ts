import type { HonoContext } from "@/server/shared/types";
import type { Hono } from "hono";
import { registerAuditRoutes } from "../../modules/audit/http/audit.routes";
import { buildAuditEvent } from "../../modules/audit/http/helpers";
import { appendAudit } from "../../modules/audit/services/append-audit";
import { auth } from "../../modules/auth/better-auth";
import { requireAuth } from "../../modules/rbac/http/middleware";
import { registerRbacRoutes } from "../../modules/rbac/http/rbac.routes";
import { registerMeRoutes } from "../../modules/users/http/me.routes";
import { registerUsersRoutes } from "../../modules/users/http/users.routes";

export function registerRest(app: Hono<HonoContext>) {
  // better-auth handles its own subroutes
  app.on(["POST", "GET"], "/auth/*", async (c) => {
    const res = await auth.handler(c.req.raw);
    // Best-effort audit for auth actions without reading sensitive payloads
    try {
      const path = c.req.path;
      const status = res.status;
      const isSuccess = status >= 200 && status < 400;
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
        await appendAudit(c.get("db"), [
          buildAuditEvent(c, {
            action,
            result: isSuccess ? "success" : "failed",
          }),
        ]);
      }
    } catch {}
    return res;
  });
  // protect API namespaces by default; concrete permissions handled in routes
  app.use("/users/*", requireAuth());
  app.use("/rbac/*", requireAuth());
  app.use("/me/*", requireAuth());
  app.use("/audit/*", requireAuth());

  app.route("/users", registerUsersRoutes());
  app.route("/rbac", registerRbacRoutes());
  app.route("/me", registerMeRoutes());
  app.route("/audit", registerAuditRoutes());
  return app;
}
