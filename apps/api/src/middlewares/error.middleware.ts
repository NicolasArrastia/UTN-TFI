import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `La ruta ${req.method} ${req.originalUrl} no existe.`,
    },
  });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  // Errores de body inválido generados por express.json().
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "El cuerpo de la solicitud no es un JSON válido.",
      },
    });
    return;
  }

  console.error("[api] error no controlado:", error);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error inesperado en el servidor.",
    },
  });
};
