import type { HonoContext } from "@/server/shared/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { UpdateUserFormSchema } from "../contracts";
import { getUserById } from "../repo/get-by-id";
import { updateUserService } from "../service/update";

export function registerMeRoutes() {
  const r = new Hono<HonoContext>();

  r.get("/", async (c) => {
    const authUser = c.get("user");
    if (!authUser) return c.json({ error: "UNAUTHORIZED" }, 401);
    const client = c.get("db");
    const user = await getUserById(authUser.id, client);
    if (!user) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ user });
  });

  r.put("/", zValidator("form", UpdateUserFormSchema), async (c) => {
    const authUser = c.get("user");
    if (!authUser) return c.json({ error: "UNAUTHORIZED" }, 401);
    const input = c.req.valid("form");
    const client = c.get("db");
    const result = await updateUserService(
      client,
      {
        id: authUser.id,
        input: {
          email: input.email,
          name: input.name,
          password: input.password,
          roleId: undefined,
          image: input.imageDelete ? null : input.image,
        },
        imageFile: input.imageFile,
      },
      c,
    );
    if (!result.ok)
      return c.json({ error: result.error }, result.status ?? 500);
    if (!result.value) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ user: result.value });
  });

  return r;
}
