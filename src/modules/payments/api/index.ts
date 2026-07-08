import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { paymentsRoutes as paymentsDetailRoutes } from "../domain/http/payments.routes";

export const paymentsModuleRoutes = new Elysia({ prefix: "/payments" })
  .use(serverContext)
  .onBeforeHandle(requireAuth)
  .use(paymentsDetailRoutes);
