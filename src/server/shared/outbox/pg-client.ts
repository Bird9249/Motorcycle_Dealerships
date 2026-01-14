import { env } from "@/server/platform/config";
import { Pool, type PoolClient } from "pg";

// Create a pg connection pool for outbox operations
// pg-transactional-outbox requires native pg Client
let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function closePgPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Get a client from the pool for transaction use
export async function getPgClient(): Promise<PoolClient> {
  const pool = getPgPool();
  return pool.connect();
}
