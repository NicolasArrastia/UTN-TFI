import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { hash } from "bcryptjs";
import { Client, type ClientConfig } from "pg";
import { env } from "../config/env.ts";
import { isMissingDatabaseError } from "../errors/database-error.ts";

const SCHEMA_PATH = fileURLToPath(
  new URL("../../../../database/crear-base-datos.sql", import.meta.url),
);
const DATABASE_NAME_PATTERN = /^[A-Za-z0-9_]+$/;
const ADMIN_EMAIL = "admin@ejemplo.com";
const BCRYPT_ROUNDS = 10;

const buildClientConfig = (connectionString: string): ClientConfig => ({
  connectionString,
  ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const parseDatabaseUrl = (): { url: URL; name: string } => {
  const url = new URL(env.databaseUrl);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!DATABASE_NAME_PATTERN.test(name)) {
    throw new Error(`El nombre de base de datos "${name}" no es válido.`);
  }

  return { url, name };
};

const connect = async (connectionString: string): Promise<Client> => {
  const client = new Client(buildClientConfig(connectionString));
  await client.connect();
  return client;
};

const createDatabase = async (url: URL, name: string): Promise<void> => {
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";

  const admin = await connect(adminUrl.toString());

  try {
    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );

    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${name}"`);
      console.log(`[db] base de datos "${name}" creada.`);
    }
  } finally {
    await admin.end();
  }
};

const openTargetDatabase = async (url: URL, name: string): Promise<Client> => {
  try {
    return await connect(url.toString());
  } catch (error) {
    if (!isMissingDatabaseError(error)) {
      throw error;
    }

    await createDatabase(url, name);
    return connect(url.toString());
  }
};

const seedAdmin = async (client: Client): Promise<void> => {
  const passwordHash = await hash(env.adminPassword, BCRYPT_ROUNDS);
  const result = await client.query(
    `INSERT INTO users (fullname, username, email, password, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT DO NOTHING`,
    ["Administrador", env.adminUsername, ADMIN_EMAIL, passwordHash],
  );

  if (result.rowCount === 0) {
    console.log(
      `[db] el usuario administrador "${env.adminUsername}" ya existe.`,
    );
    return;
  }

  console.log(`[db] usuario administrador "${env.adminUsername}" creado.`);
};

const main = async (): Promise<void> => {
  const { url, name } = parseDatabaseUrl();
  const client = await openTargetDatabase(url, name);

  try {
    const schema = await readFile(SCHEMA_PATH, "utf8");
    await client.query(schema);
    console.log("[db] esquema aplicado.");

    await seedAdmin(client);
  } finally {
    await client.end();
  }

  console.log("[db] base de datos lista.");
};

main().catch((error: unknown) => {
  console.error("[db] no se pudo preparar la base de datos:", error);
  process.exitCode = 1;
});
