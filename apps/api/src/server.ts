import app from "./app.ts";
import {
  closeDatabase,
  isSchemaReady,
  verifyDatabaseConnection,
} from "./config/database.ts";
import { env } from "./config/env.ts";

const start = async (): Promise<void> => {
  try {
    await verifyDatabaseConnection();
  } catch (error) {
    console.error("[api] no se pudo conectar a PostgreSQL:", error);
    await closeDatabase();
    process.exit(1);
  }

  if (!(await isSchemaReady())) {
    console.warn(
      "[api] la base de datos no tiene el esquema aplicado. Ejecutá `npm run db:setup -w api` contra DATABASE_URL; el login va a fallar hasta entonces.",
    );
  }

  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });

  const shutdown = async (): Promise<void> => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDatabase();
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
};

void start();
