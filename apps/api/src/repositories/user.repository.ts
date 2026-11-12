import { hashSync } from "bcryptjs";
import { env } from "../config/env.ts";
import type { User } from "../types/auth.types.ts";

/**
 * Repositorio en memoria.
 *
 * La base de datos PostgreSQL todavía no está conectada al proyecto, por lo que
 * esta primera iteración siembra el usuario administrador en memoria. Cuando se
 * incorpore el cliente de base de datos, solo debe reemplazarse este módulo:
 * los servicios y controladores no cambian.
 */
const users: User[] = [
  {
    id: 1,
    fullname: "Administrador",
    username: env.adminUsername,
    email: "admin@ejemplo.com",
    passwordHash: hashSync(env.adminPassword, 10),
    role: "admin",
    isActive: true,
  },
];

let nextUserId = Math.max(...users.map((user) => user.id)) + 1;

export const userRepository = {
  findByUsername(username: string): User | undefined {
    const normalized = username.trim().toLowerCase();

    return users.find((user) => user.username.toLowerCase() === normalized);
  },

  findByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();

    return users.find((user) => user.email.toLowerCase() === normalized);
  },

  findById(id: number): User | undefined {
    return users.find((user) => user.id === id);
  },

  async create(user: Omit<User, "id">): Promise<User> {
    const newUser: User = {
      ...user,
      id: nextUserId++,
    };

    users.push(newUser);

    return newUser;
  },
};
