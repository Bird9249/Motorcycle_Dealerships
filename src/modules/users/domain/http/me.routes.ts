import { Elysia } from "elysia";
import { z } from "zod";
import { serverContext } from "@/server/platform/http/context";
import { getUserById } from "../repo/get-by-id";
import { updateUserService } from "../service/update";

const UpdateMeBody = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  image: z.string().optional(),
  imageDelete: z.string().optional(),
  password: z.string().optional(),
});

export const meRoutes = new Elysia()
  .use(serverContext)
  .get("/", async ({ user, db, status }) => {
    if (!user) return status(401, { error: "UNAUTHORIZED" });
    const u = await getUserById(user.id, db);
    if (!u) return status(404, { error: "NOT_FOUND" });
    return { user: u };
  })
  .put(
    "/",
    async ({ user, db, body, status }) => {
      if (!user) return status(401, { error: "UNAUTHORIZED" });
      try {
        const { updated } = await updateUserService(db, {
          id: user.id,
          input: {
            email: body.email,
            name: body.name,
            password: body.password,
            roleId: undefined,
            image: body.imageDelete ? null : (body.image ?? undefined),
          },
        });
        return { user: updated };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "User not found")
          return status(404, { error: "NOT_FOUND" });
        return status(500, { error: message });
      }
    },
    { body: UpdateMeBody },
  );
