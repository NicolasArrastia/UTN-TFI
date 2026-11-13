import { AppError } from "../errors/app-error.ts";
import {
  PAYMENT_METHODS,
  type CreateSaleInput,
  type SaleItemInput,
} from "../types/sale.types.ts";
import { arrayOf, integer, oneOf, parseObject } from "./validation.ts";

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
