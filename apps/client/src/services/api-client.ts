import type { ApiErrorBody } from "../types/auth.types.ts";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

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
  } catch {
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
      body?.error?.message ?? `La solicitud falló con el estado ${response.status}.`,
      body?.error?.code ?? "UNKNOWN_ERROR",
      response.status,
    );
  }

  return body as T;
}
