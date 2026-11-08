import type { Role } from "../types/role.types.ts";

/**
 * Repositorio en memoria de roles.
 *
 * Replica las columnas de la tabla `roles`. Cuando PostgreSQL esté conectado,
 * este módulo se reemplaza por consultas reales sin modificar servicios ni
 * controladores.
 */
const SEED_DATE = "2026-01-15T12:00:00.000Z";

const roles: Role[] = [
  {
    id: 1,
    name: "admin",
    description: "Administra el comercio, los usuarios y el catálogo.",
    createdAt: SEED_DATE,
  },
  {
    id: 2,
    name: "employee",
    description: "Registra ventas y consulta la información del comercio.",
    createdAt: SEED_DATE,
  },
];

const findRoleById = (id: number): Role | undefined =>
  roles.find((role) => role.id === id);

export const roleRepository = {
  findById: findRoleById,
};
