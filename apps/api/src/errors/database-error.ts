const UNIQUE_VIOLATION = "23505";
const MISSING_DATABASE = "3D000";

interface DatabaseError {
  code?: string;
  constraint?: string;
}

const isDatabaseError = (error: unknown): error is DatabaseError =>
  typeof error === "object" && error !== null && "code" in error;

/**
 * Devuelve el nombre de la restricción violada cuando PostgreSQL rechaza un
 * valor duplicado. Sirve para traducir el error de la base a un mensaje de la
 * API cuando dos altas simultáneas pasan la validación previa.
 */
export const getUniqueViolationConstraint = (
  error: unknown,
): string | undefined => {
  if (!isDatabaseError(error) || error.code !== UNIQUE_VIOLATION) {
    return undefined;
  }

  return error.constraint;
};

export const isMissingDatabaseError = (error: unknown): boolean =>
  isDatabaseError(error) && error.code === MISSING_DATABASE;
