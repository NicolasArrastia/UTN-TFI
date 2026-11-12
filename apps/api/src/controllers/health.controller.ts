import type { Request, Response } from "express";
import {
  isSchemaReady,
  verifyDatabaseConnection,
} from "../config/database.ts";

const SCHEMA_MISSING_MESSAGE =
  "La base de datos está conectada pero falta el esquema. Ejecutá npm run db:setup -w api contra DATABASE_URL.";
const DATABASE_UNAVAILABLE_MESSAGE =
  "No se pudo conectar con PostgreSQL. Revisá DATABASE_URL y el estado de la base.";

export const healthCheck = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await verifyDatabaseConnection();
  } catch {
    res
      .status(503)
      .json({ status: "error", message: DATABASE_UNAVAILABLE_MESSAGE });
    return;
  }

  if (!(await isSchemaReady())) {
    res.status(503).json({ status: "error", message: SCHEMA_MISSING_MESSAGE });
    return;
  }

  res.status(200).json({
    status: "ok",
    message: "Server is running",
  });
};
