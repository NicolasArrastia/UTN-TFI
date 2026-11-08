import { hashSync } from "bcryptjs";
import { env } from "../config/env.ts";
import type { User } from "../types/auth.types.ts";

/**
 * Repositorio en memoria.
 *
 * La base de datos PostgreSQL todavía no está conectada al proyecto, por lo que
 * esta primera iteración siembra el usuario administrador en memoria. El rol se
 * guarda como `roleId` y se resuelve contra el repositorio de roles. Cuando se
 * incorpore el cliente de base de datos, solo debe reemplazarse este módulo:
 * los servicios y controladores no cambian.
 */
const ADMIN_ROLE_ID = 1;

const users: User[] = [
  {
    id: 1,
    fullname: "Administrador",
    username: env.adminUsername,
    email: "admin@ejemplo.com",
    passwordHash: hashSync(env.adminPassword, 10),
    roleId: ADMIN_ROLE_ID,
    isActive: true,
  },
];

export const userRepository = {
  findByUsername(username: string): User | undefined {
    const normalized = username.trim().toLowerCase();
    return users.find((user) => user.username.toLowerCase() === normalized);
  },

  findById(id: number): User | undefined {
    return users.find((user) => user.id === id);
  },
};
