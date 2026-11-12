import type { ApiErrorBody } from "../types/auth.types.ts";
import { tokenStorage } from "./token-storage.ts";

const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE_URL = configuredApiUrl ?? "/api";

/**
 * Cuando el build de producción no define `VITE_API_URL`, el cliente llama a
 * `/api` en su propio dominio. Vercel responde 405 a los POST sobre archivos
 * estáticos, así que el mensaje tiene que explicar la causa real.
 */
const describeFailure = (status: number): string => {
  if (!configuredApiUrl && import.meta.env.PROD) {
    return `La solicitud falló con el estado ${status}. Falta configurar VITE_API_URL en el deploy del cliente.`;
  }

  return `La solicitud falló con el estado ${status}.`;
};

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "No se pudo conectar con el servidor. Verificá que la API esté en ejecución.",
      "NETWORK_ERROR",
      0,
    );
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const body = isJson ? ((await response.json()) as ApiErrorBody) : null;

  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? describeFailure(response.status),
      body?.error?.code ?? "UNKNOWN_ERROR",
      response.status,
    );
  }

  return body as T;
}

/**
 * Envía una solicitud autenticada con el token guardado en el navegador.
 * Centraliza el encabezado `Authorization` para no repetirlo en cada módulo.
 */
export function authenticatedRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = tokenStorage.get();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return apiRequest<T>(path, { ...options, headers });
}
