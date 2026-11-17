import type { UserRole } from "./auth.types.ts";

/** Campos que el cliente puede enviar al modificar un usuario. */
export interface UpdateUserInput {
  fullname?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

/** Filtros ya validados del listado de usuarios. */
export interface UserListQuery {
  includeInactive: boolean;
}
