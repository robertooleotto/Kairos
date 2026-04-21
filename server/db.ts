import pg from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Create pool immediately but handle errors gracefully
const poolConfig: any = {
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/kairos_dev",
  max: 2,
};
if (process.env.DATABASE_URL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

// Prevent pool errors from crashing the process
pool.on("error", (err) => {
  console.error("[db-pool] idle client error:", err.message);
});

// Lazy drizzle instance - avoid initializing until needed
let _db: NodePgDatabase<typeof schema> | null = null;
export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    const { drizzle } = require("drizzle-orm/node-postgres");
    _db = drizzle(pool, { schema });
  }
  return _db!;
}

// Keep db export for compatibility but make it lazy
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  }
});

export async function query(sql: string, params: unknown[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
