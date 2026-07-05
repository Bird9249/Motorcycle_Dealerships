import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { masterDataRoutes as masterDataDetailRoutes } from "../domain/http/master-data.routes";

export const masterDataRoutes = new Elysia({ prefix: "/master-data" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(masterDataDetailRoutes);
