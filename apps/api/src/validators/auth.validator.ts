import { AppError } from "../errors/app-error.ts";
import { parseObject } from "./validation.ts";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

const currentPassword = (value: unknown): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(
      "Ingresá tu contraseña actual.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return value;
};

const newPassword = (value: unknown): string => {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value, "utf8") > 72
  ) {
    throw new AppError(
      "La nueva contraseña debe tener al menos 8 caracteres y no superar los 72 bytes.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return value;
};

const changePasswordValidators = {
  currentPassword,
  newPassword,
};

export const parseChangePasswordInput = (body: unknown): ChangePasswordInput =>
  parseObject<ChangePasswordInput>(
    changePasswordValidators,
    body,
    "El cuerpo de la solicitud debe ser un objeto JSON.",
  );
