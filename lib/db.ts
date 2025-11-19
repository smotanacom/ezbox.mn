import { Pool } from 'pg';

// Local PostgreSQL connection pool
let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://ezbox:ezbox123@localhost:5432/ezbox';
    pool = new Pool({ connectionString });
  }
  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return pool.query(text, params);
}

// Close pool connection
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
