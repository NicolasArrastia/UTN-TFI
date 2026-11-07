import type { NextFunction, Request, Response } from "express";
import { categoryService } from "../services/category.service.ts";

export const listCategories = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.status(200).json({ categories: categoryService.list() });
  } catch (error) {
    next(error);
  }
};
