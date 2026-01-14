import { env } from "@/server/platform/config";
import { logger } from "@/server/platform/observability/logger";
import { Client } from "pg";

/**
 * Setup database function for polling outbox messages
 * This function must be run once to create the required database function
 */
export async function setupOutboxDatabase(): Promise<void> {
  const client = new Client({ connectionString: env.DATABASE_URL });
  try {
    await client.connect();
    await client.query("BEGIN");

    // Create the function to get next outbox messages
    await client.query(/* sql */ `
      DROP FUNCTION IF EXISTS public.get_next_outbox_messages(integer, integer);
      CREATE OR REPLACE FUNCTION public.get_next_outbox_messages(
        max_size integer, lock_ms integer)
        RETURNS SETOF public.outbox
        LANGUAGE 'plpgsql'
      AS $BODY$
      DECLARE
        loop_row public.outbox%ROWTYPE;
        message_row public.outbox%ROWTYPE;
        ids uuid[] := '{}';
      BEGIN
        IF max_size < 1 THEN
          RAISE EXCEPTION 'The max_size for the next messages batch must be at least one.' using errcode = 'MAXNR';
        END IF;

        -- get (only) the oldest message of every segment but only return it if it is not locked
        FOR loop_row IN
          SELECT * FROM public.outbox m WHERE m.id in (SELECT DISTINCT ON (segment) id
            FROM public.outbox
            WHERE processed_at IS NULL AND abandoned_at IS NULL
            ORDER BY segment, created_at) order by created_at
        LOOP
          BEGIN
            EXIT WHEN cardinality(ids) >= max_size;

            -- if the message is marked as locked --> skip it
            IF loop_row.locked_until > NOW() THEN
              CONTINUE;
            END IF;

            SELECT *
              INTO message_row
              FROM public.outbox
              WHERE id = loop_row.id
              FOR NO KEY UPDATE NOWAIT; -- throw/catch error when locked

            ids := array_append(ids, message_row.id);
          EXCEPTION
            WHEN lock_not_available THEN
              CONTINUE;
            WHEN serialization_failure THEN
              CONTINUE;
          END;
        END LOOP;

        -- if max_size not reached: get the oldest parallelizable message independent of segment
        IF cardinality(ids) < max_size THEN
          FOR loop_row IN
            SELECT * FROM public.outbox
              WHERE concurrency = 'parallel' AND processed_at IS NULL AND abandoned_at IS NULL AND locked_until < NOW()
                AND id NOT IN (SELECT UNNEST(ids))
              order by created_at
          LOOP
            BEGIN
              EXIT WHEN cardinality(ids) >= max_size;

              SELECT *
                INTO message_row
                FROM public.outbox
                WHERE id = loop_row.id
                FOR NO KEY UPDATE NOWAIT;

              ids := array_append(ids, message_row.id);
            EXCEPTION
              WHEN lock_not_available THEN
                CONTINUE;
              WHEN serialization_failure THEN
                CONTINUE;
            END;
          END LOOP;
        END IF;

        -- lock and return the messages
        IF cardinality(ids) > 0 THEN
          UPDATE public.outbox
            SET locked_until = NOW() + (lock_ms || ' milliseconds')::interval
            WHERE id = ANY(ids);
        END IF;

        RETURN QUERY
          SELECT * FROM public.outbox WHERE id = ANY(ids) ORDER BY created_at;
      END;
      $BODY$;
    `);

    await client.query("COMMIT");
    logger.info("Outbox database function created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Failed to setup outbox database function", error);
    throw error;
  } finally {
    await client.end();
  }
}

setupOutboxDatabase().catch((error) => {
  logger.error("Failed to setup outbox database", error);
  process.exit(1);
});
