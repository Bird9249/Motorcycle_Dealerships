import { Elysia } from "elysia";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { IdParamSchema } from "@/modules/users/domain/contracts";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import { getAuditById } from "../repo/get-by-id";
import { queryAudit } from "../repo/query";

export const auditDetailRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => {
      return await queryAudit(query, db);
    },
    {
      beforeHandle: requirePermission(Permissions.audit.read),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const item = await getAuditById(params.id, db);
      if (!item) return status(404, { error: "NOT_FOUND" });
      return { item };
    },
    {
      beforeHandle: requirePermission(Permissions.audit.read),
      params: IdParamSchema,
    },
  );
