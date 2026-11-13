import type { NextFunction, Request, Response } from "express";
import { categoryService } from "../services/category.service.ts";
import { parseIdParam } from "../validators/category.validator.ts";

export const listCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const categories = await categoryService.list(req.query, role);

    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const id = parseIdParam(req.params.id);
    const category = await categoryService.getById(id, role);

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const category = await categoryService.create(req.body, role);

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const id = parseIdParam(req.params.id);
    const category = await categoryService.update(id, req.body, role);

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const id = parseIdParam(req.params.id);
    const category = await categoryService.remove(id, role);

    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
};
