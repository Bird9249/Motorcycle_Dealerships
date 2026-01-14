import { auditContextMiddleware } from "@/modules/audit/domain/http/middleware";
import { auth } from "@/modules/auth/domain/better-auth";
import { registerRest } from "@/server/api/rest";
import type { HonoContext } from "@/shared/types";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error";
import { httpLogger } from "./middleware/logger";
import { withTransaction } from "./middleware/transaction";

export function createServer() {
  const app = new Hono<HonoContext>().basePath("/api");
  app.use("*", httpLogger);
  app.use("*", errorHandler);
  app.use(
    "*",
    cors({
      origin: process.env.CORS_ORIGIN || "",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );
  app.get(
    "/public/*",
    serveStatic({
      root: "./public",
      rewriteRequestPath: (path) => path.replace(/^\/api\/public/, "/"),
    }),
  );

  app.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      c.set("permissions", []);
      return next();
    }

    c.set("user", { role: "user", ...session.user });
    c.set("session", session.session);
    c.set("permissions", session.permissions);
    return next();
  });

  // Global trace/context enrichment for all routes
  app.use("*", auditContextMiddleware());
  // Request-scoped transaction for all routes
  app.use("*", withTransaction);

  registerRest(app);
  app.get("/health", (c) => c.json({ ok: true }));
  return app;
}
