import type { PermissionId } from "@/server/shared/contracts/permissions";
import type { HonoContext } from "@/server/shared/types";
import type { Context, Next } from "hono";

export function requireAuth() {
  return async (c: Context<HonoContext>, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  };
}

export function requirePermission(permId: PermissionId) {
  return async (c: Context<HonoContext>, next: Next) => {
    const perms = c.get("permissions") || [];
    if (perms.length === 0 || !perms.includes(permId)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}
