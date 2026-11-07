import toast from "react-hot-toast";
import { ApiError } from "./api-client.ts";

export const notify = {
  success(message: string): void {
    toast.success(message);
  },

  error(message: string): void {
    toast.error(message);
  },

  info(message: string): void {
    toast(message, { icon: "ℹ️" });
  },
};

/**
 * Traduce cualquier error del login a un mensaje entendible para el usuario.
 * Centralizar los textos evita mensajes distintos para la misma situación.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return "No se pudo conectar con el servidor. Verificá que la API esté en ejecución.";
      case "INVALID_CREDENTIALS":
        return "Usuario o contraseña incorrectos.";
      case "USER_INACTIVE":
        return "El usuario está deshabilitado. Contactá al administrador.";
      case "VALIDATION_ERROR":
        return error.message;
      default:
        return error.message;
    }
  }

  return "Ocurrió un error inesperado. Intentá nuevamente.";
}

/**
 * Traduce los errores del módulo de productos a mensajes entendibles.
 * Los errores de validación conservan el detalle devuelto por la API.
 */
export function getProductErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return "No se pudo conectar con el servidor. Verificá que la API esté en ejecución.";
      case "UNAUTHORIZED":
        return "Tu sesión expiró. Iniciá sesión nuevamente.";
      case "FORBIDDEN":
        return "No tenés permisos para realizar esta acción.";
      case "PRODUCT_NOT_FOUND":
        return "El producto no existe o fue eliminado.";
      case "INVALID_CATEGORY":
        return "La categoría seleccionada no está disponible.";
      case "INVALID_TAG":
        return "Alguna de las etiquetas seleccionadas no está disponible.";
      case "VALIDATION_ERROR":
        return error.message;
      default:
        return error.message;
    }
  }

  return "Ocurrió un error inesperado. Intentá nuevamente.";
}
