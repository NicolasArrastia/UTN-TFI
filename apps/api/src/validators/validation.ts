import { AppError } from "../errors/app-error.ts";

export type Parser<T> = (value: unknown) => T;

export type Validators<T> = {
  [K in keyof T]-?: Parser<Exclude<T[K], undefined>>;
};

export type OptionalValidators<T> = {
  [K in keyof T]-?: Parser<Exclude<T[K], undefined> | undefined>;
};

const MAX_INTEGER = 2_147_483_647;
const MAX_MONEY = 99_999_999.99;

const invalid = (message: string): AppError =>
  new AppError(message, 400, "VALIDATION_ERROR");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRecord = (
  value: unknown,
  message: string,
): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw invalid(message);
  }

  return value;
};

const parseFields = <T>(
  validators: OptionalValidators<T>,
  data: Record<string, unknown>,
  keys: string[],
): T => {
  const entries: Array<[string, unknown]> = [];

  for (const key of keys) {
    const parser = validators[key as keyof T];

    if (!parser) {
      continue;
    }

    const parsed = parser(data[key]);

    if (parsed !== undefined) {
      entries.push([key, parsed]);
    }
  }

  return Object.fromEntries(entries) as T;
};

export const parseObject = <T>(
  validators: Validators<T>,
  value: unknown,
  message: string,
): T =>
  parseFields(validators, parseRecord(value, message), Object.keys(validators));

export const parseOptionalObject = <T>(
  validators: OptionalValidators<T>,
  value: unknown,
  message: string,
): T =>
  parseFields(validators, parseRecord(value, message), Object.keys(validators));

export const parsePartialObject = <T>(
  validators: Validators<T>,
  value: unknown,
  messages: { invalid: string; empty: string },
): T => {
  const data = parseRecord(value, messages.invalid);
  const keys = Object.keys(validators).filter((key) => key in data);

  if (keys.length === 0) {
    throw invalid(messages.empty);
  }

  return parseFields(validators, data, keys);
};

export interface TextOptions {
  field: string;
  maxLength?: number;
}

export const text =
  ({ field, maxLength }: TextOptions): Parser<string> =>
  (value) => {
    if (typeof value !== "string") {
      throw invalid(`${field} es obligatorio.`);
    }

    const parsed = value.trim();

    if (parsed.length === 0) {
      throw invalid(`${field} es obligatorio.`);
    }

    if (maxLength !== undefined && parsed.length > maxLength) {
      throw invalid(`${field} no puede superar los ${maxLength} caracteres.`);
    }

    return parsed;
  };

export const nullableText =
  ({ field, maxLength }: TextOptions): Parser<string | null> =>
  (value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== "string") {
      throw invalid(`${field} debe ser un texto.`);
    }

    const parsed = value.trim();

    if (maxLength !== undefined && parsed.length > maxLength) {
      throw invalid(`${field} no puede superar los ${maxLength} caracteres.`);
    }

    return parsed.length === 0 ? null : parsed;
  };

export const optionalText =
  ({ field, maxLength }: TextOptions): Parser<string | undefined> =>
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      throw invalid(`${field} no es válido.`);
    }

    const parsed = value.trim();

    if (parsed.length === 0) {
      return undefined;
    }

    if (maxLength !== undefined && parsed.length > maxLength) {
      throw invalid(`${field} no puede superar los ${maxLength} caracteres.`);
    }

    return parsed;
  };

export interface IntegerOptions {
  field: string;
  min?: number;
}

export const integer =
  ({ field, min = 0 }: IntegerOptions): Parser<number> =>
  (value) => {
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

export const money =
  (field: string): Parser<number> =>
  (value) => {
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

export const boolean =
  (field: string): Parser<boolean> =>
  (value) => {
    if (typeof value !== "boolean") {
      throw invalid(`${field} debe ser true o false.`);
    }

    return value;
  };

export const arrayOf =
  <T>(parser: Parser<T>, message: string): Parser<T[]> =>
  (value) => {
    if (!Array.isArray(value)) {
      throw invalid(message);
    }

    return value.map((item) => parser(item));
  };

export const unique =
  <T>(parser: Parser<T[]>, message: string): Parser<T[]> =>
  (value) => {
    const items = parser(value);

    if (new Set(items).size !== items.length) {
      throw invalid(message);
    }

    return items;
  };

export const withDefault =
  <T>(parser: Parser<T>, fallback: T): Parser<T> =>
  (value) =>
    value === undefined ? fallback : parser(value);

export const optional =
  <T>(parser: Parser<T>): Parser<T | undefined> =>
  (value) =>
    value === undefined ? undefined : parser(value);

export const oneOf =
  <T extends string>(values: readonly T[], message: string): Parser<T> =>
  (value) => {
    if (typeof value !== "string" || !values.includes(value as T)) {
      throw invalid(message);
    }

    return value as T;
  };

export const map =
  <T, U>(parser: Parser<T>, transform: (value: T) => U): Parser<U> =>
  (value) =>
    transform(parser(value));

export interface IntegerStringOptions {
  field: string;
  max?: number;
  maxMessage?: string;
}

export const integerString =
  ({
    field,
    max = MAX_INTEGER,
    maxMessage,
  }: IntegerStringOptions): Parser<number> =>
  (value) => {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
      throw invalid(`${field} debe ser un número entero positivo.`);
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed > max) {
      throw invalid(
        maxMessage ?? `${field} debe ser un número entero positivo.`,
      );
    }

    return parsed;
  };
