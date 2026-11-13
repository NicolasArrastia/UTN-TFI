import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { authService } from "../services/auth.service.ts";
import { parseChangePasswordInput } from "../validators/auth.validator.ts";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, password } = req.body as {
      username?: unknown;
      password?: unknown;
    };

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.trim().length === 0 ||
      password.length === 0
    ) {
      throw new AppError(
        "Ingresá usuario y contraseña.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const result = await authService.login(username, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.auth) {
      throw new AppError("No autenticado.", 401, "UNAUTHORIZED");
    }

    const user = await authService.getProfile(req.auth.sub);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.auth) {
      throw new AppError("No autenticado.", 401, "UNAUTHORIZED");
    }

    const { currentPassword, newPassword } = parseChangePasswordInput(req.body);

    await authService.changePassword(
      req.auth.sub,
      currentPassword,
      newPassword,
    );

    res.status(200).json({
      message: "La contraseña se actualizó correctamente.",
    });
  } catch (error) {
    next(error);
  }
};
