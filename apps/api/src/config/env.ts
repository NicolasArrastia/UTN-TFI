import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Configuración leída desde el entorno.
 *
 * Si existe un `.env` en la raíz del repositorio se carga con Node
 * (`process.loadEnvFile`), sin dependencias extra. Las variables ya definidas
 * en el entorno tienen prioridad, así que en Render manda el panel del
 * servicio. Los valores por defecto son solo para desarrollo local.
 */
const ENV_FILE_PATH = fileURLToPath(
  new URL("../../../../.env", import.meta.url),
);

if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true" || value === "1";
};

const DEFAULT_DATABASE_URL =
  "postgres://postgres:postgres@localhost:5432/utn_tfi";

const DEFAULT_CLIENT_URL = "http://localhost:5173";

/**
 * Orígenes permitidos para CORS. Acepta una lista separada por comas para
 * cubrir, por ejemplo, el dominio de producción y los previews de Vercel.
 * El navegador nunca envía la barra final en el header Origin.
 */
const toOriginList = (value: string | undefined): string[] =>
  (value ?? DEFAULT_CLIENT_URL)
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

// Las bases locales no usan TLS; los proveedores en la nube (Render) sí.
const isLocalDatabase = /(^|[@/])(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(
  databaseUrl,
);

export const env = {
  port: toNumber(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin",
  databaseUrl,
  databaseSsl: toBoolean(process.env.DATABASE_SSL, !isLocalDatabase),
  clientOrigins: toOriginList(process.env.CLIENT_URL),
} as const;
