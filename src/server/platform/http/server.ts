import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { existsSync } from "node:fs";
import { Elysia } from "elysia";
import { createRestRoutes } from "../../api/rest";
import { serverContext } from "./context";
import { createHttpLogger } from "./middleware/logger";

export function createServer() {
  const app = new Elysia({ prefix: "/api" }).use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  if (existsSync("./public")) {
    app.use(staticPlugin({ assets: "./public", prefix: "/public" }));
  }

  return app
    .use(serverContext)
    .use(createHttpLogger())
    .onError(
      ({
        error,
        code,
        set,
        requestId,
        traceId,
        actorId,
        actorRole,
        ip,
        userAgent,
        tenantId,
        request,
      }) => {
        let status = 500;
        if (code === "NOT_FOUND") status = 404;
        else if (code === "VALIDATION") status = 422;
        else if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof (error as { status: unknown }).status === "number"
        ) {
          status = (error as { status: number }).status;
        }

        set.status = status;

        // Best-effort audit for failures (async, non-blocking)
        try {
          const path = new URL(request.url).pathname;
          const shouldAudit = ["/api/users", "/api/rbac", "/api/auth"].some(
            (p) => path.startsWith(p),
          );
          if (shouldAudit) {
            import("@/modules/audit/domain/services/append-audit").then(
              ({ appendAudit }) => {
                import("@/server/platform/db/client").then(({ db }) => {
                  const { nowISO } = require("@/shared/lib/date-time");
                  appendAudit(db, [
                    {
                      occurredAt: nowISO(),
                      requestId,
                      traceId,
                      ip,
                      userAgent,
                      tenantId,
                      actorId,
                      actorRole,
                      path,
                      method: request.method,
                      action:
                        status === 400
                          ? "VALIDATION.FAILED"
                          : status === 403
                            ? "RBAC.DENIED"
                            : "HTTP.REQUEST.FAILED",
                      result: "failed",
                      error:
                        error instanceof Error
                          ? error.message.slice(0, 200)
                          : String(error).slice(0, 200),
                    },
                  ]).catch(() => {});
                });
              },
            );
          }
        } catch {}

        const message =
          error instanceof Error ? error.message : "Internal Server Error";
        return { error: message };
      },
    )
    .use(createRestRoutes())
    .get("/health", () => ({ ok: true }));
}
