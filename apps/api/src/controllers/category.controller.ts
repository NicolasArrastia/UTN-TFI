import type { NextFunction, Request, Response } from "express";
import { categoryService } from "../services/category.service.ts";
import { parseIdParam } from "../validators/category.validator.ts";

export const listCategories = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const role = req.auth?.role ?? "employee";
    res
      .status(200)
      .json({ categories: categoryService.list(req.query, role) });
  } catch (error) {
    next(error);
  }
};

export const getCategory = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const role = req.auth?.role ?? "employee";
    const id = parseIdParam(req.params.id);
    const category = categoryService.getById(id, role);

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const role = req.auth?.role ?? "employee";
    const category = categoryService.create(req.body, role);

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const role = req.auth?.role ?? "employee";
    const id = parseIdParam(req.params.id);
    const category = categoryService.update(id, req.body, role);

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const role = req.auth?.role ?? "employee";
    const id = parseIdParam(req.params.id);
    const category = categoryService.remove(id, role);

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};
