import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { fileRoutes } from "../domain/http/files.routes";
import { uploadDetailRoutes } from "../domain/http/upload.routes";

export const uploadRoutes = new Elysia()
  .use(
    new Elysia({ prefix: "/upload" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(uploadDetailRoutes),
  )
  .use(
    new Elysia({ prefix: "/files" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(fileRoutes),
  );
