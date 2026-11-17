import { AppError } from "../errors/app-error.ts";
import type { UserRole } from "../types/auth.types.ts";
import type { UpdateUserInput, UserListQuery } from "../types/user.types.ts";
import {
  boolean,
  integerString,
  map,
  oneOf,
  parseObject,
  parseOptionalObject,
  parsePartialObject,
  text,
  withDefault,
} from "./validation.ts";

export interface CreateUserInput {
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const MAX_FULLNAME_LENGTH = 100;
const MAX_USERNAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 150;

const fullname = text({
  field: "El nombre completo",
  maxLength: MAX_FULLNAME_LENGTH,
});

const username = map(
  text({ field: "El nombre de usuario", maxLength: MAX_USERNAME_LENGTH }),
  (value) => value.toLowerCase(),
);

const email = map(
  text({ field: "El correo electrónico", maxLength: MAX_EMAIL_LENGTH }),
  (value) => {
    const normalized = value.toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError(
        "El correo electrónico no es válido.",
        400,
        "VALIDATION_ERROR",
      );
    }

    return normalized;
  },
);

const password = (value: unknown): string => {
  if (typeof value !== "string" || value.length < 8 || value.length > 72) {
    throw new AppError(
      "La contraseña debe tener entre 8 y 72 caracteres.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return value;
};

const role = oneOf(
  ["admin", "employee"] as const,
  "El rol debe ser admin o employee.",
);

const isActive = boolean("El estado");

const createValidators = {
  fullname,
  username,
  email,
  password,
  role,
};

const updateValidators = {
  fullname,
  email,
  role,
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

export const parseCreateUserInput = (body: unknown): CreateUserInput =>
  parseObject<CreateUserInput>(
    createValidators,
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );

export const parseUpdateUserInput = (body: unknown): UpdateUserInput =>
  parsePartialObject<UpdateUserInput>(updateValidators, body, {
    invalid: "El cuerpo de la solicitud debe ser un objeto JSON.",
    empty: "Enviá al menos un campo para actualizar.",
  });

export const parseUserListQuery = (query: unknown): UserListQuery =>
  parseOptionalObject<UserListQuery>(
    listQueryValidators,
    query,
    "Los parámetros de búsqueda no son válidos.",
  );

export const parseIdParam = integerString({ field: "El identificador" });
