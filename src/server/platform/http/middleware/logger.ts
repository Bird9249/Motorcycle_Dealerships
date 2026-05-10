import { Elysia } from "elysia";
import { logger as base } from "../../observability/logger";

export function createHttpLogger() {
  return new Elysia({ name: "http-logger" }).onAfterHandle(
    ({ request, set }) => {
      const status = set.status ?? 200;
      const url = new URL(request.url);
      base.info(`${request.method} ${url.pathname} -> ${status}`);
    },
  );
}
