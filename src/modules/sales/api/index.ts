import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { salesRoutes as salesDetailRoutes } from "../domain/http/sales.routes";

export const salesModuleRoutes = new Elysia({ prefix: "/sales" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(salesDetailRoutes);
