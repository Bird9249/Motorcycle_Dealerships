import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { rbacRoutes } from "../domain/http/rbac.routes";

export const rolesRoutes = new Elysia().use(
  new Elysia({ prefix: "/rbac" })
    .use(serverContext)
    .onBeforeHandle(requireAuth)
    .use(rbacRoutes),
);
