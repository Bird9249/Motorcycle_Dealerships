import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import type { FilterConditionDTO } from "@/shared/contracts/base";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  RoleCreateSchema,
  RoleIdParamSchema,
  RoleLookupQuerySchema,
  RoleUpdateSchema,
} from "../contracts";
import { Permissions } from "../contracts/permissions";
import { getRoleById } from "../repo/get-role-by-id";
import { listRoles } from "../repo/list-roles";
import { createRoleService } from "../service/create";
import { deleteRoleService } from "../service/delete";
import { updateRoleService } from "../service/update";
import { getEffectivePermissionsService } from "../service/user-permissions";

export const rbacRoutes = new Elysia()
  .use(serverContext)
  .get("/my-permissions", async ({ db, session, status }) => {
    const userId = session?.id;
    if (!userId) return status(401, { error: "Unauthorized" });
    const perms = await getEffectivePermissionsService(db, userId);
    return { permissions: perms.map((p: { id: string }) => p.id) };
  })
  .get(
    "/roles",
    async ({ db, query }) => {
      return await listRoles(query, db);
    },
    {
      beforeHandle: requirePermission(Permissions.users.read),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/roles/lookup",
    async ({ db, query }) => {
      const { q, limit, skip } = query as {
        q?: string;
        limit: number;
        skip: number;
      };
      const filters: FilterConditionDTO[] | undefined = q
        ? [{ field: "name", op: "contains" as const, value: q }]
        : undefined;
      const result = await listRoles({ limit, offset: skip, filters }, db);
      const items = result.data.map((r: { id: string; name: string }) => ({
        id: r.id,
        name: r.name,
      }));
      return { items, total: result.meta.total };
    },
    {
      beforeHandle: requirePermission(Permissions.users.read),
      query: RoleLookupQuerySchema,
    },
  )
  .get(
    "/roles/:id",
    async ({ db, params, status }) => {
      const item = await getRoleById(params.id, db);
      if (!item) return status(404, { error: "Not Found" });
      return item;
    },
    { beforeHandle: requirePermission(Permissions.users.read) },
  )
  .get(
    "/roles/lookup/:id",
    async ({ db, params }) => {
      const role = await getRoleById(params.id, db);
      if (!role) return { item: null };
      return { item: { id: role.id, name: role.name } };
    },
    { beforeHandle: requirePermission(Permissions.users.read) },
  )
  .post(
    "/roles",
    async ({ db, body, status }) => {
      try {
        const out = await createRoleService(db, { input: body });
        return status(201, out.created);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission(Permissions.users.ban),
      body: RoleCreateSchema,
    },
  )
  .patch(
    "/roles/:id",
    async ({ db, params, body, status }) => {
      try {
        const { updated } = await updateRoleService(db, {
          id: params.id,
          input: body,
        });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Role not found" || message === "Failed to update role")
          return status(404, { error: "NOT_FOUND" });
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission(Permissions.users.ban),
      params: RoleIdParamSchema,
      body: RoleUpdateSchema,
    },
  )
  .delete(
    "/roles/:id",
    async ({ db, params, status }) => {
      try {
        const { deleted } = await deleteRoleService(db, { id: params.id });
        if (!deleted) return status(404, { error: "NOT_FOUND" });
        return deleted;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Role not found")
          return status(404, { error: "NOT_FOUND" });
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission(Permissions.users.ban),
      params: RoleIdParamSchema,
    },
  );
