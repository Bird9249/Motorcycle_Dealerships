import { requirePermission } from "@/server/modules/rbac/http/middleware";
import { OffsetPageQuerySchema } from "@/server/shared/contracts/base";
import { BanUserSchema, CreateUserFormSchema, IdParamSchema, UpdateUserFormSchema } from "../contracts";
import type { HonoContext } from "@/server/shared/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getUserById } from "../repo/get-by-id";
import { listUsers } from "../repo/list";
import { banUserService } from "../service/ban";
import { createUserService } from "../service/create";
import { deleteUserService } from "../service/delete";
import { unbanUserService } from "../service/unban";
import { updateUserService } from "../service/update";

export function registerUsersRoutes() {
  const r = new Hono<HonoContext>();
  // Note: construct repos/use-cases per request to bind request-scoped transaction

  r.get(
    "/",
    requirePermission("users:read"),
    zValidator("query", OffsetPageQuerySchema),
    async (c) => {
      const client = c.get("db");

      const q = c.req.valid("query");
      const result = await listUsers(q, client);
      return c.json(result);
    },
  );

  r.get(
    "/:id",
    requirePermission("users:read"),
    zValidator("param", IdParamSchema),
    async (c) => {
      const client = c.get("db");

      const { id } = c.req.valid("param");
      const user = await getUserById(id, client);
      if (!user) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json(user);
    },
  );

  r.post(
    "/",
    requirePermission("users:create"),
    zValidator("form", CreateUserFormSchema),
    async (c) => {
      const client = c.get("db");

      const input = c.req.valid("form");
      const result = await createUserService(
        client,
        {
          input: {
            email: input.email,
            name: input.name,
            password: input.password,
            roleId: input.roleId,
          },
          imageFile: input.imageFile,
        },
        c,
      );
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      return c.json(result, 201);
    },
  );

  r.put(
    "/:id",
    requirePermission("users:update"),
    zValidator("param", IdParamSchema),
    zValidator("form", UpdateUserFormSchema),
    async (c) => {
      const client = c.get("db");

      const { id } = c.req.valid("param");
      const input = c.req.valid("form");
      const result = await updateUserService(
        client,
        {
          id,
          input: {
            email: input.email,
            name: input.name,
            roleId: input.roleId,
            password: input.password,
            image: input.imageDelete ? null : input.image,
          },
          imageFile: input.imageFile,
        },
        c,
      );
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json(result);
    },
  );

  r.delete(
    "/:id",
    requirePermission("users:delete"),
    zValidator("param", IdParamSchema),
    async (c) => {
      const client = c.get("db");

      const { id } = c.req.valid("param");
      const result = await deleteUserService(client, { id }, c);
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json(result);
    },
  );

  r.post(
    "/:id/ban",
    requirePermission("users:ban"),
    zValidator("param", IdParamSchema),
    zValidator("json", BanUserSchema),
    async (c) => {
      const client = c.get("db");

      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const result = await banUserService(
        client,
        {
          id,
          reason: body.reason ?? undefined,
          expires: body.expires ?? null,
        },
        c,
      );
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);
      return c.json(result);
    },
  );

  r.post(
    "/:id/unban",
    requirePermission("users:ban"),
    zValidator("param", IdParamSchema),
    async (c) => {
      const client = c.get("db");

      const { id } = c.req.valid("param");
      const result = await unbanUserService(client, { id }, c);
      if (!result.ok)
        return c.json({ error: result.error }, result.status ?? 500);

      return c.json(result);
    },
  );

  return r;
}
