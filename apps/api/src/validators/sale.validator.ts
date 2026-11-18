import { AppError } from "../errors/app-error.ts";
import {
  PAYMENT_METHODS,
  SALE_SORT_FIELDS,
  SALE_STATUSES,
  type CreateSaleInput,
  type SaleItemInput,
  type SaleListQuery,
} from "../types/sale.types.ts";
import { SORT_DIRS } from "../types/sort.types.ts";
import {
  arrayOf,
  dateString,
  integer,
  integerString,
  oneOf,
  optional,
  parseObject,
  parseOptionalObject,
  withDefault,
} from "./validation.ts";

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

const itemValidators = {
  productId: integer({ field: "El ID del producto", min: 1 }),
  quantity: integer({ field: "La cantidad", min: 1 }),
};

const parseSaleItem = (value: unknown): SaleItemInput =>
  parseObject<SaleItemInput>(
    itemValidators,
    value,
    "Cada ítem debe ser un objeto con producto y cantidad.",
  );

const saleValidators = {
  paymentMethod: oneOf(
    PAYMENT_METHODS,
    "El método de pago debe ser cash, transfer, card u other.",
  ),
  items: arrayOf(parseSaleItem, "Los ítems deben enviarse en un arreglo."),
};

const pageQuery = withDefault(integerString({ field: "El parámetro page" }), 1);

const limitQuery = withDefault(
  integerString({
    field: "El parámetro limit",
    max: MAX_PAGE_LIMIT,
    maxMessage: `El parámetro limit no puede superar ${MAX_PAGE_LIMIT}.`,
  }),
  DEFAULT_PAGE_LIMIT,
);

const paginationValidators = {
  page: pageQuery,
  limit: limitQuery,
};

const listQueryValidators = {
  ...paginationValidators,
  sortBy: withDefault(
    oneOf(
      SALE_SORT_FIELDS,
      "El parámetro sortBy debe ser number, createdAt, user, total, paymentMethod o status.",
    ),
    "createdAt",
  ),
  sortDir: withDefault(
    oneOf(SORT_DIRS, "El parámetro sortDir debe ser asc o desc."),
    "desc",
  ),
  userId: optional(integerString({ field: "El parámetro userId" })),
  from: optional(dateString("El parámetro from")),
  to: optional(dateString("El parámetro to")),
  status: optional(
    oneOf(SALE_STATUSES, "El parámetro status debe ser completed o cancelled."),
  ),
};

export const parseCreateSaleInput = (value: unknown): CreateSaleInput => {
  const sale = parseObject<CreateSaleInput>(
    saleValidators,
    value,
    "Los datos de la venta deben enviarse como un objeto.",
  );

  if (sale.items.length === 0) {
    throw new AppError(
      "La venta debe tener al menos un producto.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return sale;
};

export const parsePagination = (
  query: unknown,
): { page: number; limit: number } =>
  parseOptionalObject<{ page: number; limit: number }>(
    paginationValidators,
    query,
    "Los parámetros de paginación no son válidos.",
  );

export const parseSaleListQuery = (query: unknown): SaleListQuery => {
  const parsed = parseOptionalObject<SaleListQuery>(
    listQueryValidators,
    query,
    "Los parámetros del historial no son válidos.",
  );

  if (
    parsed.from !== undefined &&
    parsed.to !== undefined &&
    parsed.from > parsed.to
  ) {
    throw new AppError(
      "La fecha desde no puede ser posterior a la fecha hasta.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return parsed;
};
