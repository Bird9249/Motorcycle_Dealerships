import { db } from "@/server/platform/db/client";
import type { HonoContext } from "@/server/shared/types";
import type { Context } from "hono";

export async function withTransaction(
  c: Context<HonoContext>,
  next: () => Promise<void>,
) {
  await db.transaction(async (tx) => {
    c.set("db", tx);
    await next();
  });
}
