import type {
  CreateTagInput,
  TagListQuery,
  UpdateTagInput,
} from "../types/tag.types.ts";
import {
  boolean,
  hexColor,
  integerString,
  map,
  oneOf,
  parseObject,
  parseOptionalObject,
  parsePartialObject,
  text,
  withDefault,
} from "./validation.ts";

const MAX_NAME_LENGTH = 50;

const name = text({ field: "El nombre", maxLength: MAX_NAME_LENGTH });
const color = hexColor("El color");
const isActive = boolean("El estado");

const createValidators = {
  name,
  color,
};

const updateValidators = {
  name,
  color,
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

export const parseCreateTagInput = (body: unknown): CreateTagInput =>
  parseObject<CreateTagInput>(
    createValidators,
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );

export const parseUpdateTagInput = (body: unknown): UpdateTagInput =>
  parsePartialObject<UpdateTagInput>(updateValidators, body, {
    invalid: "El cuerpo de la solicitud debe ser un objeto JSON.",
    empty: "Enviá al menos un campo para actualizar.",
  });

export const parseTagListQuery = (query: unknown): TagListQuery =>
  parseOptionalObject<TagListQuery>(
    listQueryValidators,
    query,
    "Los parámetros de búsqueda no son válidos.",
  );

export const parseIdParam = integerString({ field: "El identificador" });
