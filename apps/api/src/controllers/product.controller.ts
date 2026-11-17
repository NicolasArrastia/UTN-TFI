import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { productService } from "../services/product.service.ts";
import type { UserRole } from "../types/auth.types.ts";
import { parseIdParam } from "../validators/product.validator.ts";

const getRole = (req: Request): UserRole => {
  if (!req.auth) {
    throw new AppError("No autenticado.", 401, "UNAUTHORIZED");
  }

  return req.auth.role;
};

export const listProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await productService.list(req.query, getRole(req));

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const product = await productService.getById(id, getRole(req));

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await productService.create(req.body);

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const product = await productService.update(id, req.body);

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const product = await productService.remove(id);

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};
