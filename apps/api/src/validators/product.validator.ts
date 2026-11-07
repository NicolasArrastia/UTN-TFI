import type {
  ProductInput,
  ProductListQuery,
  UpdateProductInput,
} from "../types/product.types.ts";
import {
  arrayOf,
  boolean,
  integer,
  integerString,
  map,
  money,
  nullableText,
  oneOf,
  optional,
  optionalText,
  parseObject,
  parseOptionalObject,
  parsePartialObject,
  text,
  unique,
  withDefault,
} from "./validation.ts";

const MAX_NAME_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

const categoryId = integer({ field: "La categoría", min: 1 });
const name = text({ field: "El nombre", maxLength: MAX_NAME_LENGTH });
const description = nullableText({
  field: "La descripción",
  maxLength: MAX_DESCRIPTION_LENGTH,
});
const price = money("El precio");
const cost = money("El costo");
const stock = integer({ field: "El stock" });
const minStock = integer({ field: "El stock mínimo" });
const isActive = boolean("El estado");

const tagIds = withDefault(
  unique(
    arrayOf(
      integer({ field: "Cada etiqueta", min: 1 }),
      "Las etiquetas deben ser un arreglo de identificadores.",
    ),
    "No se puede repetir una etiqueta.",
  ),
  [],
);

const createValidators = {
  categoryId,
  name,
  description,
  price,
  cost,
  stock: withDefault(stock, 0),
  minStock: withDefault(minStock, 0),
  isActive: withDefault(isActive, true),
  tagIds,
};

const updateValidators = {
  categoryId,
  name,
  description,
  price,
  cost,
  stock,
  minStock,
  isActive,
  tagIds,
};

const isActiveQuery = withDefault(
  map(
    oneOf(
      ["true", "false", "all"] as const,
      "El parámetro isActive debe ser true, false o all.",
    ),
    (value) => (value === "all" ? "all" : value === "true"),
  ),
  true,
);

const lowStockQuery = withDefault(
  map(
    oneOf(
      ["true", "false"] as const,
      "El parámetro lowStock debe ser true o false.",
    ),
    (value) => value === "true",
  ),
  false,
);

const listQueryValidators = {
  search: optionalText({
    field: "El parámetro search",
    maxLength: MAX_NAME_LENGTH,
  }),
  categoryId: optional(integerString({ field: "El parámetro categoryId" })),
  tagId: optional(integerString({ field: "El parámetro tagId" })),
  isActive: isActiveQuery,
  lowStock: lowStockQuery,
  page: withDefault(integerString({ field: "El parámetro page" }), 1),
  limit: withDefault(
    integerString({
      field: "El parámetro limit",
      max: MAX_PAGE_LIMIT,
      maxMessage: `El parámetro limit no puede superar ${MAX_PAGE_LIMIT}.`,
    }),
    DEFAULT_PAGE_LIMIT,
  ),
};

export const parseCreateProductInput = (body: unknown): ProductInput =>
  parseObject<ProductInput>(
    createValidators,
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );

export const parseUpdateProductInput = (body: unknown): UpdateProductInput =>
  parsePartialObject<UpdateProductInput>(updateValidators, body, {
    invalid: "El cuerpo de la solicitud debe ser un objeto JSON.",
    empty: "Enviá al menos un campo para actualizar.",
  });

export const parseProductListQuery = (query: unknown): ProductListQuery =>
  parseOptionalObject<ProductListQuery>(
    listQueryValidators,
    query,
    "Los parámetros de búsqueda no son válidos.",
  );

export const parseIdParam = integerString({ field: "El identificador" });
