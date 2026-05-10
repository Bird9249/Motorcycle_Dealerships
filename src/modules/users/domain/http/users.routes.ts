import { Elysia } from "elysia";
import { z } from "zod";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import { BanUserSchema, IdParamSchema } from "../contracts";
import { getUserById } from "../repo/get-by-id";
import { listUsers } from "../repo/list";
import { banUserService } from "../service/ban";
import { createUserService } from "../service/create";
import { deleteUserService } from "../service/delete";
import { unbanUserService } from "../service/unban";
import { updateUserService } from "../service/update";

const CreateUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  image: z.string().optional(),
  password: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
});

const UpdateUserBody = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  image: z.string().optional(),
  imageDelete: z.string().optional(),
  roleId: z.string().min(1).optional(),
  password: z.string().optional(),
});

export const usersRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => {
      return await listUsers(query, db);
    },
    {
      beforeHandle: requirePermission("users:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const user = await getUserById(params.id, db);
      if (!user) return status(404, { error: "NOT_FOUND" });
      return user;
    },
    {
      beforeHandle: requirePermission("users:read"),
      params: IdParamSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, status }) => {
      try {
        const out = await createUserService(db, {
          input: {
            email: body.email,
            name: body.name,
            password: body.password,
            roleId: body.roleId,
            image: body.image ?? undefined,
          },
        });
        return status(201, out.created);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("users:create"),
      body: CreateUserBody,
    },
  )
  .put(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const { updated } = await updateUserService(db, {
          id: params.id,
          input: {
            email: body.email,
            name: body.name,
            roleId: body.roleId,
            password: body.password,
            image: body.imageDelete ? null : (body.image ?? undefined),
          },
        });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "User not found")
          return status(404, { error: "NOT_FOUND" });
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("users:update"),
      params: IdParamSchema,
      body: UpdateUserBody,
    },
  )
  .delete(
    "/:id",
    async ({ db, params, status }) => {
      try {
        const { deleted } = await deleteUserService(db, { id: params.id });
        if (!deleted) return status(404, { error: "NOT_FOUND" });
        return deleted;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("users:delete"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/ban",
    async ({ db, params, body, status }) => {
      try {
        const result = await banUserService(db, {
          id: params.id,
          reason: body.reason ?? undefined,
          expires: body.expires ?? null,
        });
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("users:ban"),
      params: IdParamSchema,
      body: BanUserSchema,
    },
  )
  .post(
    "/:id/unban",
    async ({ db, params, status }) => {
      try {
        const result = await unbanUserService(db, { id: params.id });
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("users:ban"),
      params: IdParamSchema,
    },
  );
