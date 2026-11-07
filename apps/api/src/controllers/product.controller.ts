import type { NextFunction, Request, Response } from "express";
import { productService } from "../services/product.service.ts";
import { parseIdParam } from "../validators/product.validator.ts";

export const listProducts = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.status(200).json(productService.list(req.query));
  } catch (error) {
    next(error);
  }
};

export const getProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const id = parseIdParam(req.params.id);
    const product = productService.getById(id);

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const product = productService.create(req.body);

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const id = parseIdParam(req.params.id);
    const product = productService.update(id, req.body);

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const id = parseIdParam(req.params.id);
    const product = productService.remove(id);

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};
