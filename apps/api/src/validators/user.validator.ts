import { AppError } from "../errors/app-error.ts";
import type { UserRole } from "../types/auth.types.ts";
import { map, oneOf, parseObject, text } from "./validation.ts";

export interface CreateUserInput {
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const fullname = text({
  field: "El nombre completo",
  maxLength: 100,
});

const username = map(
  text({ field: "El nombre de usuario", maxLength: 100 }),
  (value) => value.toLowerCase(),
);

const email = map(
  text({ field: "El correo electrónico", maxLength: 150 }),
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

const createValidators = {
  fullname,
  username,
  email,
  password,
  role,
};

export const parseCreateUserInput = (body: unknown): CreateUserInput =>
  parseObject<CreateUserInput>(
    createValidators,
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );
