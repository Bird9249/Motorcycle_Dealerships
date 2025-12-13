import type { DbClient } from "@/server/platform/db/client";
import { outbox } from "@/server/platform/db/schema";
import { logger } from "@/server/platform/observability/logger";
import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { DbTransaction } from "../types";

export type OutboxWorkerOptions<TPayload> = {
  batchSize?: number;
  maxRetry?: number;
  backoffMs?: number;
  topic?: string; // optional filter
  // process a batch and return ids processed; throw to trigger retry path
  process: (
    client: DbTransaction,
    rows: { id: string; payload: TPayload }[],
  ) => Promise<string[]>;
};

export function createOutboxWorker<TPayload>(
  client: DbClient,
  opts: OutboxWorkerOptions<TPayload>,
) {
  // const { outbox } = require("@/server/platform/db/schema");
  const BATCH_SIZE = opts.batchSize ?? 100;
  const MAX_RETRY = opts.maxRetry ?? 5;
  const BACKOFF_MS = opts.backoffMs ?? 15_000;

  async function flushOnce(): Promise<void> {
    const now = new Date();
    const baseWhere = and(
      eq(outbox.status, "pending"),
      or(
        isNull(outbox.nextAttemptAt),
        lte(outbox.nextAttemptAt, now.toISOString()),
      ),
    );
    const whereExpr = opts.topic
      ? and(baseWhere, eq(outbox.topic, opts.topic))
      : baseWhere;
    const pending = (await client
      .select()
      .from(outbox)
      .where(whereExpr)
      .orderBy(desc(outbox.createdAt))
      .limit(BATCH_SIZE)) as Array<{ id: string; payload: TPayload }>;

    if (pending.length === 0) return;

    const ids = pending.map((p) => p.id);
    try {
      await client.transaction(async (tx) => {
        // mark processing
        await tx
          .update(outbox)
          .set({ status: "processing" })
          .where(inArray(outbox.id, ids));

        const processedIds = await opts.process(tx, pending);

        // mark done only processed
        if (processedIds.length > 0) {
          await tx
            .update(outbox)
            .set({ status: "done" })
            .where(inArray(outbox.id, processedIds));
        }
      });
    } catch (err) {
      const backoffAt = new Date(Date.now() + BACKOFF_MS);
      // retry path outside tx; increment retryCount and reschedule
      await client
        .update(outbox)
        .set({
          retryCount: sql`${outbox.retryCount} + 1`,
          nextAttemptAt: backoffAt.toISOString(),
          status: "pending",
        })
        .where(inArray(outbox.id, ids));

      // move to dead after threshold
      await client
        .update(outbox)
        .set({ status: "dead" })
        .where(and(inArray(outbox.id, ids), gte(outbox.retryCount, MAX_RETRY)));
      throw err;
    }
  }
  let isRunning = false;
  let loop = false;

  function start(intervalMs = 2000) {
    if (loop) return;
    loop = true;

    (async () => {
      while (loop) {
        if (!isRunning) {
          isRunning = true;

          try {
            await flushOnce();
          } catch (err) {
            logger.error("Error flushing outbox", err);
          } finally {
            isRunning = false;
          }
        }
        await Bun.sleep(intervalMs);
      }
    })().catch((err) => {
      logger.error("Outbox worker loop error", err);
    });
  }

  function stop() {
    loop = false;
  }

  return { flushOnce, start, stop } as const;
}
