import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { reportsRoutes as reportsDetailRoutes } from "../domain/http/reports.routes";

export const reportsModuleRoutes = new Elysia({ prefix: "/reports" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(reportsDetailRoutes);
