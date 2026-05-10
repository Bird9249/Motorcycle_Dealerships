import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { meRoutes } from "../domain/http/me.routes";
import { usersRoutes as usersDetailRoutes } from "../domain/http/users.routes";

export const usersRoutes = new Elysia()
  .use(serverContext)
  .use(
    new Elysia({ prefix: "/me" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(meRoutes),
  )
  .use(
    new Elysia({ prefix: "/users" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(usersDetailRoutes),
  );
