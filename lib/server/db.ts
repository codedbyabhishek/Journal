import mysql, { Pool } from 'mysql2/promise';

const DEFAULT_DB_PORT = 3306;

declare global {
  // eslint-disable-next-line no-var
  var __tradingDiaryDbPool: Pool | undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbPool(): Pool {
  if (global.__tradingDiaryDbPool) {
    return global.__tradingDiaryDbPool;
  }

  const host = requiredEnv('DB_HOST');
  // Hostinger/MySQL users are often granted for 127.0.0.1 and not ::1.
  // Using localhost can resolve to IPv6 (::1) and trigger access denied.
  const normalizedHost = host === 'localhost' ? '127.0.0.1' : host;
  const user = requiredEnv('DB_USER');
  const password = requiredEnv('DB_PASSWORD');
  const database = requiredEnv('DB_NAME');
  const port = Number(process.env.DB_PORT || DEFAULT_DB_PORT);

  const pool = mysql.createPool({
    host: normalizedHost,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
  });

  global.__tradingDiaryDbPool = pool;
  return pool;
}

export async function dbQuery<T = unknown>(
  sql: string,
  values: unknown[] = []
): Promise<T> {
  const pool = getDbPool();
  const [rows] = await pool.query(sql, values);
  return rows as T;
}

export async function dbExecute(sql: string, values: unknown[] = []) {
  const pool = getDbPool();
  const [result] = await pool.execute(sql, values);
  return result;
}
