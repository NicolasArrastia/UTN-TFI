/**
 * Configuración leída desde el entorno.
 *
 * No hay dotenv instalado: las variables se definen en la shell. Los valores
 * por defecto son solo para desarrollo local.
 */
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

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

// Las bases locales no usan TLS; los proveedores en la nube (Neon) sí.
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
} as const;
