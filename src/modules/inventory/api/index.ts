import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { inventoryRoutes as inventoryDetailRoutes } from "../domain/http/inventory.routes";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(inventoryDetailRoutes);
