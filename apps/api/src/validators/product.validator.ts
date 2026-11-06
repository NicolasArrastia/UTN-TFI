import { AppError } from "../errors/app-error.ts";
import type {
  ProductInput,
  ProductListQuery,
  UpdateProductInput,
} from "../types/product.types.ts";

const MAX_NAME_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_MONEY = 99_999_999.99;
const MAX_INTEGER = 2_147_483_647;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

const invalid = (message: string): AppError =>
  new AppError(message, 400, "VALIDATION_ERROR");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireRecord = (
  value: unknown,
  message: string,
): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw invalid(message);
  }

  return value;
};

const parseName = (value: unknown): string => {
  if (typeof value !== "string") {
    throw invalid("El nombre es obligatorio.");
  }

  const name = value.trim();

  if (name.length === 0) {
    throw invalid("El nombre es obligatorio.");
  }

  if (name.length > MAX_NAME_LENGTH) {
    throw invalid(
      `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres.`,
    );
  }

  return name;
};

const parseDescription = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw invalid("La descripción debe ser un texto.");
  }

  const description = value.trim();

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw invalid(
      `La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`,
    );
  }

  return description.length === 0 ? null : description;
};

const parseMoney = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalid(`${field} debe ser un número válido.`);
  }

  if (value < 0) {
    throw invalid(`${field} debe ser mayor o igual a 0.`);
  }

  if (value > MAX_MONEY) {
    throw invalid(`${field} no puede superar ${MAX_MONEY}.`);
  }

  const rounded = Math.round(value * 100) / 100;

  if (Math.abs(value - rounded) > 1e-9) {
    throw invalid(`${field} admite como máximo dos decimales.`);
  }

  return rounded;
};

const parseInteger = (value: unknown, field: string, min = 0): number => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw invalid(`${field} debe ser un número entero.`);
  }

  if (value < min) {
    throw invalid(`${field} debe ser mayor o igual a ${min}.`);
  }

  if (value > MAX_INTEGER) {
    throw invalid(`${field} es demasiado grande.`);
  }

  return value;
};

const parseBoolean = (value: unknown, field: string): boolean => {
  if (typeof value !== "boolean") {
    throw invalid(`${field} debe ser true o false.`);
  }

  return value;
};

const parseTagIds = (value: unknown): number[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw invalid("Las etiquetas deben ser un arreglo de identificadores.");
  }

  const tagIds = value.map((tagId) =>
    parseInteger(tagId, "Cada etiqueta", 1),
  );

  if (new Set(tagIds).size !== tagIds.length) {
    throw invalid("No se puede repetir una etiqueta.");
  }

  return tagIds;
};

export const parseCreateProductInput = (body: unknown): ProductInput => {
  const data = requireRecord(
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );

  return {
    categoryId: parseInteger(data.categoryId, "La categoría", 1),
    name: parseName(data.name),
    description: parseDescription(data.description),
    price: parseMoney(data.price, "El precio"),
    cost: parseMoney(data.cost, "El costo"),
    stock: data.stock === undefined ? 0 : parseInteger(data.stock, "El stock"),
    minStock:
      data.minStock === undefined
        ? 0
        : parseInteger(data.minStock, "El stock mínimo"),
    isActive:
      data.isActive === undefined
        ? true
        : parseBoolean(data.isActive, "El estado"),
    tagIds: parseTagIds(data.tagIds),
  };
};

export const parseUpdateProductInput = (body: unknown): UpdateProductInput => {
  const data = requireRecord(
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );
  const input: UpdateProductInput = {};
  let hasChanges = false;

  if ("categoryId" in data) {
    input.categoryId = parseInteger(data.categoryId, "La categoría", 1);
    hasChanges = true;
  }

  if ("name" in data) {
    input.name = parseName(data.name);
    hasChanges = true;
  }

  if ("description" in data) {
    input.description = parseDescription(data.description);
    hasChanges = true;
  }

  if ("price" in data) {
    input.price = parseMoney(data.price, "El precio");
    hasChanges = true;
  }

  if ("cost" in data) {
    input.cost = parseMoney(data.cost, "El costo");
    hasChanges = true;
  }

  if ("stock" in data) {
    input.stock = parseInteger(data.stock, "El stock");
    hasChanges = true;
  }

  if ("minStock" in data) {
    input.minStock = parseInteger(data.minStock, "El stock mínimo");
    hasChanges = true;
  }

  if ("isActive" in data) {
    input.isActive = parseBoolean(data.isActive, "El estado");
    hasChanges = true;
  }

  if ("tagIds" in data) {
    input.tagIds = parseTagIds(data.tagIds);
    hasChanges = true;
  }

  if (!hasChanges) {
    throw invalid("Enviá al menos un campo para actualizar.");
  }

  return input;
};

export const parseIdParam = (value: unknown): number => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw invalid("El identificador debe ser un número entero positivo.");
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id > MAX_INTEGER) {
    throw invalid("El identificador debe ser un número entero positivo.");
  }

  return id;
};

const parseQueryString = (
  value: unknown,
  field: string,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw invalid(`El parámetro ${field} no es válido.`);
  }

  return value;
};

const parseSearch = (value: unknown): string | undefined => {
  const raw = parseQueryString(value, "search");

  if (raw === undefined) {
    return undefined;
  }

  const search = raw.trim();

  if (search.length === 0) {
    return undefined;
  }

  if (search.length > MAX_NAME_LENGTH) {
    throw invalid(
      `El parámetro search no puede superar los ${MAX_NAME_LENGTH} caracteres.`,
    );
  }

  return search;
};

const parseQueryPositiveInteger = (
  value: unknown,
  field: string,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw invalid(`El parámetro ${field} debe ser un número entero positivo.`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed > MAX_INTEGER) {
    throw invalid(`El parámetro ${field} debe ser un número entero positivo.`);
  }

  return parsed;
};

const parseQueryBoolean = (
  value: unknown,
  field: string,
): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw invalid(`El parámetro ${field} debe ser true o false.`);
};

const parseIsActive = (value: unknown): "all" | boolean => {
  if (value === undefined) {
    return true;
  }

  if (value === "all") {
    return "all";
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw invalid("El parámetro isActive debe ser true, false o all.");
};

const parseLimit = (value: unknown): number => {
  const limit = parseQueryPositiveInteger(value, "limit");

  if (limit === undefined) {
    return DEFAULT_PAGE_LIMIT;
  }

  if (limit > MAX_PAGE_LIMIT) {
    throw invalid(
      `El parámetro limit no puede superar ${MAX_PAGE_LIMIT}.`,
    );
  }

  return limit;
};

export const parseProductListQuery = (query: unknown): ProductListQuery => {
  const data = requireRecord(
    query,
    "Los parámetros de búsqueda no son válidos.",
  );

  const result: ProductListQuery = {
    isActive: parseIsActive(data.isActive),
    lowStock: parseQueryBoolean(data.lowStock, "lowStock") ?? false,
    page: parseQueryPositiveInteger(data.page, "page") ?? 1,
    limit: parseLimit(data.limit),
  };

  const search = parseSearch(data.search);
  if (search !== undefined) {
    result.search = search;
  }

  const categoryId = parseQueryPositiveInteger(data.categoryId, "categoryId");
  if (categoryId !== undefined) {
    result.categoryId = categoryId;
  }

  const tagId = parseQueryPositiveInteger(data.tagId, "tagId");
  if (tagId !== undefined) {
    result.tagId = tagId;
  }

  return result;
};
