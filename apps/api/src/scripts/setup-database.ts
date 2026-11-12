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

interface CategorySeed {
  id: number;
  name: string;
  description: string;
}

interface TagSeed {
  id: number;
  name: string;
  color: string;
}

/**
 * Categorías y etiquetas base. Los productos en memoria referencian estos ids,
 * por eso el seed los inserta de forma explícita e idempotente.
 */
const CATEGORY_SEEDS: readonly CategorySeed[] = [
  {
    id: 1,
    name: "Almacén",
    description: "Productos secos y de despensa.",
  },
  {
    id: 2,
    name: "Bebidas",
    description: "Bebidas con y sin alcohol.",
  },
  {
    id: 3,
    name: "Limpieza",
    description: "Artículos de limpieza para el hogar.",
  },
  {
    id: 4,
    name: "Electrónica",
    description: "Accesorios y productos electrónicos.",
  },
];

const TAG_SEEDS: readonly TagSeed[] = [
  { id: 1, name: "Oferta", color: "#F97316" },
  { id: 2, name: "Novedad", color: "#22C55E" },
  { id: 3, name: "Sin TACC", color: "#0EA5E9" },
];

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

const syncIdentitySequence = async (
  client: Client,
  table: "categories" | "tags",
): Promise<void> => {
  await client.query(
    `SELECT setval(
       pg_get_serial_sequence($1, 'id'),
       COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1,
       FALSE
     )`,
    [table],
  );
};

const seedCategories = async (client: Client): Promise<void> => {
  for (const category of CATEGORY_SEEDS) {
    await client.query(
      `INSERT INTO categories (id, name, description, is_active)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING`,
      [category.id, category.name, category.description],
    );
  }

  await syncIdentitySequence(client, "categories");
  console.log("[db] categorías base aseguradas.");
};

const seedTags = async (client: Client): Promise<void> => {
  for (const tag of TAG_SEEDS) {
    await client.query(
      `INSERT INTO tags (id, name, color, is_active)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING`,
      [tag.id, tag.name, tag.color],
    );
  }

  await syncIdentitySequence(client, "tags");
  console.log("[db] etiquetas base aseguradas.");
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

    await seedCategories(client);
    await seedTags(client);
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
