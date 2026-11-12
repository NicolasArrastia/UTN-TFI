import {
  Pool,
  type PoolConfig,
  type QueryResult,
  type QueryResultRow,
} from "pg";
import { env } from "./env.ts";

const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("[db] error inesperado en el pool de PostgreSQL:", error);
});

export const query = <T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> => pool.query<T>(text, values);

export const verifyDatabaseConnection = async (): Promise<void> => {
  await pool.query("SELECT 1");
};

export const closeDatabase = (): Promise<void> => pool.end();
