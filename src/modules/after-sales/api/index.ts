import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { afterSalesRoutes as afterSalesDetailRoutes } from "../domain/http/after-sales.routes";

export const afterSalesModuleRoutes = new Elysia({ prefix: "/after-sales" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(afterSalesDetailRoutes);
