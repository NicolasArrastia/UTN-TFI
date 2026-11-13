import {
  Pool,
  type PoolClient,
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

export const withTransaction = async <T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  let discardConnection = false;

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      discardConnection = true;
    }

    throw error;
  } finally {
    client.release(discardConnection);
  }
};

export const verifyDatabaseConnection = async (): Promise<void> => {
  await pool.query("SELECT 1");
};

const USERS_TABLE = "public.users";

/**
 * Indica si el esquema ya fue aplicado. La API necesita la tabla `users` para
 * autenticar, y una base recién creada existe pero no tiene tablas: sin esta
 * verificación el login falla con un 500 genérico en lugar de un mensaje claro.
 */
export const isSchemaReady = async (): Promise<boolean> => {
  const result = await pool.query<{ ready: boolean }>(
    "SELECT to_regclass($1) IS NOT NULL AS ready",
    [USERS_TABLE],
  );

  return result.rows[0]?.ready ?? false;
};

export const closeDatabase = (): Promise<void> => pool.end();
