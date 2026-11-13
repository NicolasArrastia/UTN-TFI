import type { QueryResultRow } from "pg";
import { query } from "../config/database.ts";
import type { User, UserRole } from "../types/auth.types.ts";

interface UserRow extends QueryResultRow {
  id: number;
  fullname: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

const USER_COLUMNS = `
  id,
  fullname,
  username,
  email,
  password AS "passwordHash",
  role,
  is_active AS "isActive"
`;

export const userRepository = {
  async findByUsername(username: string): Promise<User | undefined> {
    const result = await query<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [username.trim()],
    );

    return result.rows[0];
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await query<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()],
    );

    return result.rows[0];
  },

  async findById(id: number): Promise<User | undefined> {
    const result = await query<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id],
    );

    return result.rows[0];
  },

  async create(user: Omit<User, "id">): Promise<User> {
    const result = await query<UserRow>(
      `INSERT INTO users (fullname, username, email, password, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${USER_COLUMNS}`,
      [
        user.fullname,
        user.username,
        user.email,
        user.passwordHash,
        user.role,
        user.isActive,
      ],
    );

    const created = result.rows[0];

    if (!created) {
      throw new Error("PostgreSQL no devolvió el usuario creado.");
    }

    return created;
  },

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await query(
      `UPDATE users
       SET password = $1
       WHERE id = $2 AND is_active = TRUE`,
      [passwordHash, id],
    );

    return (result.rowCount ?? 0) > 0;
  },
};
