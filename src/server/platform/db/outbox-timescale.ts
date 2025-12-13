import pg from "pg";
import { env } from "../config";
import { logger } from "../observability/logger";

export async function ensureOutboxHypertable(): Promise<void> {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    // Check extension exists
    const ext = await client.query<{ extversion: string }>(
      "SELECT extversion FROM pg_extension WHERE extname='timescaledb'",
    );
    if (ext.rowCount === 0) {
      // best-effort create; some managed DBs forbid this
      try {
        await client.query("CREATE EXTENSION IF NOT EXISTS timescaledb");
      } catch (e) {
        logger.warn("TimescaleDB extension not available; skipping hypertable");
        return;
      }
    }

    // Create hypertable if not exists
    await client.query(
      "SELECT create_hypertable('outbox','created_at', chunk_time_interval => interval '1 day', if_not_exists => true)",
    );
    logger.info("Outbox hypertable ensured (TimescaleDB)");
  } catch (err) {
    logger.error("Failed to ensure outbox hypertable", err);
    throw err;
  } finally {
    await client.end();
  }
}

export async function ensureOutboxPolicies(): Promise<void> {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    // Verify hypertable exists
    const hyper = await client.query<{ hypertable_name: string }>(
      "SELECT hypertable_name FROM timescaledb_information.hypertables WHERE hypertable_name='outbox'",
    );
    if (hyper.rowCount === 0) {
      logger.warn("Outbox is not a hypertable; skipping policies");
      return;
    }

    // Set compression options (ignore failures on unsupported versions)
    try {
      await client.query(
        "ALTER TABLE outbox SET (timescaledb.compress, timescaledb.compress_segmentby = 'topic')",
      );
    } catch (e) {
      logger.warn("Unable to set compression options; continuing", e);
    }

    // Add retention policy if missing
    const hasRetention = await client.query(
      "SELECT 1 FROM timescaledb_information.jobs WHERE proc_name='policy_retention' AND hypertable_name='outbox'",
    );
    if (hasRetention.rowCount === 0) {
      try {
        await client.query(
          "SELECT add_retention_policy('outbox', INTERVAL '30 days')",
        );
      } catch (e) {
        logger.warn("Failed to add retention policy; continuing", e);
      }
    }

    // Add compression policy if missing
    const hasCompression = await client.query(
      "SELECT 1 FROM timescaledb_information.jobs WHERE proc_name='policy_compression' AND hypertable_name='outbox'",
    );
    if (hasCompression.rowCount === 0) {
      try {
        await client.query(
          "SELECT add_compression_policy('outbox', INTERVAL '7 days')",
        );
      } catch (e) {
        logger.warn("Failed to add compression policy; continuing", e);
      }
    }

    logger.info("Outbox policies ensured (TimescaleDB)");
  } catch (err) {
    logger.error("Failed to ensure outbox policies", err);
    throw err;
  } finally {
    await client.end();
  }
}
