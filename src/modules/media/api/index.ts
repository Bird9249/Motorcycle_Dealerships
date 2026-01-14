import { requireAuth } from "@/modules/roles/domain/http/middleware";
import type { HonoContext } from "@/shared/types";
import type { Hono } from "hono";
import { registerMediaRoutes } from "../domain/http/media.routes";

export function registerMediaAPI(app: Hono<HonoContext>) {
  app.use("/media/*", requireAuth());

  app.route("/media", registerMediaRoutes());

  return app;
}
