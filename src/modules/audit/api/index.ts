import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { auditDetailRoutes } from "../domain/http/audit.routes";

export const auditRoutes = new Elysia().use(
  new Elysia({ prefix: "/audit" })
    .use(serverContext)
    .onBeforeHandle(requireAuth)
    .use(auditDetailRoutes),
);
