import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { saleRepository } from "../repositories/sale.repository.ts";
import { parseCreateSaleInput } from "../validators/sale.validator.ts";
import { parseObject, text } from "../validators/validation.ts";

const MAX_ID = 2_147_483_647;

const cancellationValidators = {
  reason: text({ field: "El motivo de la anulación", maxLength: 500 }),
};

const parsePositiveInteger = (
  value: unknown,
  field: string,
  max: number,
): number => {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);

    if (Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= max) {
      return parsed;
    }
  }

  throw new AppError(
    `${field} debe ser un entero entre 1 y ${max}.`,
    400,
    "VALIDATION_ERROR",
  );
};

const parsePagination = (req: Request) => ({
  page: parsePositiveInteger(
    req.query.page === undefined ? "1" : req.query.page,
    "La página",
    MAX_ID,
  ),
  limit: parsePositiveInteger(
    req.query.limit === undefined ? "20" : req.query.limit,
    "El límite",
    100,
  ),
});

const parseCatalogSearch = (value: unknown): string => {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string" || value.trim().length > 150) {
    throw new AppError(
      "La búsqueda debe ser un texto de hasta 150 caracteres.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return value.trim();
};

export const listSaleCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req);
    const search = parseCatalogSearch(req.query.search);
    const catalog = await saleRepository.listCatalog(page, limit, search);

    res.status(200).json(catalog);
  } catch (error) {
    next(error);
  }
};

export const listSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req);

    res.status(200).json(await saleRepository.list(page, limit));
  } catch (error) {
    next(error);
  }
};

export const getSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parsePositiveInteger(req.params.id, "El ID de la venta", MAX_ID);
    const sale = await saleRepository.findById(id);

    if (!sale) {
      throw new AppError("Venta no encontrada.", 404, "SALE_NOT_FOUND");
    }

    res.status(200).json({ sale });
  } catch (error) {
    next(error);
  }
};

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.auth) {
      throw new AppError("No autenticado.", 401, "UNAUTHORIZED");
    }

    const input = parseCreateSaleInput(req.body);
    const sale = await saleRepository.create(req.auth.sub, input);

    res.status(201).json({ sale });
  } catch (error) {
    next(error);
  }
};

export const cancelSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.auth) {
      throw new AppError("No autenticado.", 401, "UNAUTHORIZED");
    }

    const id = parsePositiveInteger(req.params.id, "El ID de la venta", MAX_ID);
    const { reason } = parseObject<{ reason: string }>(
      cancellationValidators,
      req.body,
      "Los datos de la anulación deben enviarse como un objeto.",
    );

    const sale = await saleRepository.cancel(id, req.auth.sub, reason);

    res.status(200).json({ sale });
  } catch (error) {
    next(error);
  }
};
