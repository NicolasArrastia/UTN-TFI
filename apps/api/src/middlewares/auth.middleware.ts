import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { authService } from "../services/auth.service.ts";
import type { UserRole } from "../types/auth.types.ts";

const extractBearerToken = (header: string | undefined): string | undefined => {
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
};

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(
      new AppError(
        "No se envió un token de autenticación.",
        401,
        "UNAUTHORIZED",
      ),
    );
    return;
  }

  try {
    req.auth = authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(
        new AppError(
          "No se envió un token de autenticación.",
          401,
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(
        new AppError(
          "No tenés permisos para realizar esta acción.",
          403,
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
