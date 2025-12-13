import type { Context } from "hono";
import { logger as base } from "../../observability/logger";

export const httpLogger = async (c: Context, next: () => Promise<void>) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  base.info(`${c.req.method} ${c.req.path} -> ${c.res.status} ${ms}ms`);
};
