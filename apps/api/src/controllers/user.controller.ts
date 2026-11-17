import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { userService } from "../services/user.service.ts";
import { parseIdParam } from "../validators/user.validator.ts";

const requireAuthUserId = (req: Request): number => {
  if (!req.auth) {
    throw new AppError("No autenticado.", 401, "UNAUTHORIZED");
  }

  return req.auth.sub;
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const users = await userService.list(req.query, role);

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await userService.create(req.body);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const user = await userService.update(id, req.body, requireAuthUserId(req));

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const user = await userService.remove(id, requireAuthUserId(req));

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
