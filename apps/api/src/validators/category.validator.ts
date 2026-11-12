import type {
  CreateCategoryInput,
  CategoryListQuery,
  UpdateCategoryInput,
} from "../types/category.types.ts";
import {
  boolean,
  integerString,
  map,
  nullableText,
  oneOf,
  parseObject,
  parseOptionalObject,
  parsePartialObject,
  text,
  withDefault,
} from "./validation.ts";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const name = text({ field: "El nombre", maxLength: MAX_NAME_LENGTH });
const description = nullableText({
  field: "La descripción",
  maxLength: MAX_DESCRIPTION_LENGTH,
});
const isActive = boolean("El estado");

const createValidators = {
  name,
  description: withDefault(description, null),
};

const updateValidators = {
  name,
  description,
  isActive,
};

const includeInactiveQuery = withDefault(
  map(
    oneOf(
      ["true", "false"] as const,
      "El parámetro includeInactive debe ser true o false.",
    ),
    (value) => value === "true",
  ),
  false,
);

const listQueryValidators = {
  includeInactive: includeInactiveQuery,
};

export const parseCreateCategoryInput = (body: unknown): CreateCategoryInput =>
  parseObject<CreateCategoryInput>(
    createValidators,
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );

export const parseUpdateCategoryInput = (body: unknown): UpdateCategoryInput =>
  parsePartialObject<UpdateCategoryInput>(updateValidators, body, {
    invalid: "El cuerpo de la solicitud debe ser un objeto JSON.",
    empty: "Enviá al menos un campo para actualizar.",
  });

export const parseCategoryListQuery = (query: unknown): CategoryListQuery =>
  parseOptionalObject<CategoryListQuery>(
    listQueryValidators,
    query,
    "Los parámetros de búsqueda no son válidos.",
  );

export const parseIdParam = integerString({ field: "El identificador" });
