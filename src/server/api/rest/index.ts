import { registerAuditAPIRoutes } from "@/modules/audit/api";
import { registerAuthRoutes } from "@/modules/auth/api";
import { registerMediaAPI } from "@/modules/media/api";
import { registerRolesAPIRoutes } from "@/modules/roles/api";
import { registerUsersAPIRoutes } from "@/modules/users/api";
import type { HonoContext } from "@/shared/types";
import type { Hono } from "hono";

export function registerRest(app: Hono<HonoContext>) {
  // Register all module API routes
  registerAuthRoutes(app);
  registerUsersAPIRoutes(app);
  registerRolesAPIRoutes(app);
  registerAuditAPIRoutes(app);
  registerMediaAPI(app);

  return app;
}
