import type { Context } from "hono";
import type { Result } from "./result";
import { err, ok } from "./result";
import type { DbTransaction, HonoContext } from "./types";

export type ServiceSuccessHook<TIn, TOut> = (args: {
  client: DbTransaction;
  input: TIn;
  output: TOut;
  ctx?: Context<HonoContext>;
}) => Promise<void> | void;

export type ServiceErrorHook<TIn> = (args: {
  client: DbTransaction;
  input: TIn;
  error: unknown;
  ctx?: Context<HonoContext>;
}) => Promise<void> | void;

export function makeService<TIn, TOut>(opts: {
  name: string;
  run: (client: DbTransaction, input: TIn) => Promise<TOut>;
  onSuccess?: ServiceSuccessHook<TIn, TOut>;
  onError?: ServiceErrorHook<TIn>;
}) {
  const { run, onSuccess, onError } = opts;

  return async function execute(
    client: DbTransaction,
    input: TIn,
    ctx?: Context<HonoContext>,
  ): Promise<Result<TOut, unknown>> {
    try {
      const output = await run(client, input);
      if (onSuccess) await onSuccess({ client, input, output, ctx });
      return ok<TOut>(output);
    } catch (e) {
      if (onError) await onError({ client, input, error: e, ctx });
      return err<unknown>(e);
    }
  };
}
