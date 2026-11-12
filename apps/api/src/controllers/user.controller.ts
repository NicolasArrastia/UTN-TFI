import type { NextFunction, Request, Response } from "express";
import { userService } from "../services/user.service.ts";

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
