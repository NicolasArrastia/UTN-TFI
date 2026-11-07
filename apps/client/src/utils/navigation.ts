export interface NavigationState {
  from?: string;
}

/**
 * Devuelve la ruta de origen enviada por navegación o un valor por defecto.
 * Se usa para volver al listado conservando búsqueda, filtros y página.
 */
export function getPreviousPath(state: unknown, fallback: string): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof (state as NavigationState).from === "string"
  ) {
    return (state as NavigationState).from ?? fallback;
  }

  return fallback;
}
