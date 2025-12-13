import type { FilterConditionDTO } from "@/server/shared/contracts/base";
import { OffsetPageQuerySchema } from "@/server/shared/contracts/base";
import { Permissions } from "@/server/shared/contracts/permissions";
import { RoleCreateSchema, RoleIdParamSchema, RoleLookupQuerySchema, RoleUpdateSchema } from "../contracts";
import type { HonoContext } from "@/server/shared/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getRoleById } from "../repo/get-role-by-id";
import { listRoles } from "../repo/list-roles";
import { createRoleService } from "../service/create";
import { deleteRoleService } from "../service/delete";
import { updateRoleService } from "../service/update";
import { getEffectivePermissionsService } from "../service/user-permissions";
import { requirePermission } from "./middleware";

export function registerRbacRoutes() {
  const app = new Hono<HonoContext>();

  app.get("/my-permissions", async (c) => {
    const client = c.get("db");
    const user = c.get("session");
    const userId: string | undefined = user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const perms = await getEffectivePermissionsService(client, userId);
    return c.json({ permissions: perms.map((p: { id: string }) => p.id) });
  });

  // CRUD roles
  app.get(
    "/roles",
    requirePermission(Permissions.users.read),
    zValidator("query", OffsetPageQuerySchema),
    async (c) => {
      const client = c.get("db");
      const q = c.req.valid("query");
      const result = await listRoles(q, client);
      return c.json(result);
    },
  );

  // Lookup roles for combobox (supports q, limit, skip)
  app.get(
    "/roles/lookup",
    requirePermission(Permissions.users.read),
    zValidator("query", RoleLookupQuerySchema),
    async (c) => {
      const client = c.get("db");
      const { q, limit, skip } = c.req.valid("query") as {
        q?: string;
        limit: number;
        skip: number;
      };
      const filters: FilterConditionDTO[] | undefined = q
        ? [{ field: "name", op: "contains", value: q }]
        : undefined;
      const result = await listRoles(
        {
          limit,
          offset: skip,
          // filter by name contains query
          filters,
        },
        client,
      );
      const items = result.data.map((r: { id: string; name: string }) => ({
        id: r.id,
        name: r.name,
      }));
      return c.json({ items, total: result.meta.total });
    },
  );

  app.get(
    "/roles/:id",
    requirePermission(Permissions.users.read),
    async (c) => {
      const client = c.get("db");
      const id = c.req.param("id");
      const item = await getRoleById(id, client);
      if (!item) return c.json({ error: "Not Found" }, 404);
      return c.json(item);
    },
  );

  // Hydrate role by id for combobox
  app.get(
    "/roles/lookup/:id",
    requirePermission(Permissions.users.read),
    async (c) => {
      const client = c.get("db");
      const id = c.req.param("id");
      const role = await getRoleById(id, client);
      if (!role) return c.json({ item: null }, 200);
      return c.json({ item: { id: role.id, name: role.name } });
    },
  );

  app.post(
    "/roles",
    requirePermission(Permissions.users.ban),
    zValidator("json", RoleCreateSchema),
    async (c) => {
      const client = c.get("db");
      const body = c.req.valid("json");
      const result = await createRoleService(client, body, c);
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      return c.json(result, 201);
    },
  );

  app.patch(
    "/roles/:id",
    requirePermission(Permissions.users.ban),
    zValidator("param", RoleIdParamSchema),
    zValidator("json", RoleUpdateSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param") as { id: string };
      const body = c.req.valid("json");
      const result = await updateRoleService(
        client,
        {
          id,
          input: body,
        },
        c,
      );
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      return c.json(result);
    },
  );

  app.delete(
    "/roles/:id",
    requirePermission(Permissions.users.ban),
    zValidator("param", RoleIdParamSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param") as { id: string };
      const result = await deleteRoleService(client, { id }, c);
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      return c.json(result);
    },
  );

  return app;
}
