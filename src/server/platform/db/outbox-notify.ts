import pg from "pg";
import { env } from "../config";
import { logger } from "../observability/logger";

type OnNotify = () => Promise<void>;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ensure Postgres trigger/function for NOTIFY on outbox inserts (statement-level)
export async function ensureOutboxNotifyTrigger(): Promise<void> {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_outbox_new() RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify('outbox_new', 'insert');
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS outbox_notify_insert ON outbox;
      CREATE TRIGGER outbox_notify_insert
      AFTER INSERT ON outbox
      FOR EACH STATEMENT
      EXECUTE FUNCTION notify_outbox_new();
    `);
    logger.info("Outbox NOTIFY trigger ensured");
  } catch (err) {
    logger.error("Failed to ensure outbox NOTIFY trigger", err);
    throw err;
  } finally {
    await client.end();
  }
}

// Subscribe LISTEN outbox_new with debounce and auto-reconnect
export function createOutboxListener(onNotify: OnNotify) {
  let closed = false;
  let notifySeq = 0;

  const DEBOUNCE_MS = 150; // coalesce bursts
  const RECONNECT_MS = 2000;

  async function run(): Promise<void> {
    const client = new pg.Client({ connectionString: env.DATABASE_URL });
    client.on("error", (err) => {
      logger.error("Outbox LISTEN client error", err);
    });
    try {
      await client.connect();
      await client.query("LISTEN outbox_new");
      logger.info("LISTEN outbox_new subscribed");

      client.on("notification", () => {
        notifySeq += 1;
        const seq = notifySeq;
        void (async () => {
          await delay(DEBOUNCE_MS);
          if (!closed && seq === notifySeq) {
            await onNotify();
          }
        })();
      });

      // Keep process alive until closed
      while (!closed) {
        // simple sleep; pg client keeps the socket open
        // eslint-disable-next-line no-await-in-loop
        await delay(10_000);
      }
    } catch (err) {
      if (!closed) {
        logger.error("LISTEN loop crashed; will reconnect", err);
        setTimeout(() => {
          if (!closed) void run();
        }, RECONNECT_MS);
      }
    }
  }

  function start() {
    closed = false;
    void run();
  }

  function stop() {
    closed = true;
  }

  return { start, stop } as const;
}
