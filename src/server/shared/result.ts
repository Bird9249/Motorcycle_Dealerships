import type { ContentfulStatusCode } from "hono/utils/http-status";

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E; status?: ContentfulStatusCode };
export type Result<T, E> = Ok<T> | Err<E>;
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E, status?: ContentfulStatusCode): Err<E> => ({
  ok: false,
  error,
  status,
});
