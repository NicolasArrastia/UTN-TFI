import type { QueryResultRow } from "pg";
import { query } from "../config/database.ts";
import type { Category, CategoryInput } from "../types/category.types.ts";

interface CategoryRow extends QueryResultRow {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORY_COLUMNS = `
  id,
  name,
  description,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  description: row.description,
  isActive: row.isActive,
  createdAt: new Date(row.createdAt).toISOString(),
  updatedAt: new Date(row.updatedAt).toISOString(),
});

export const categoryRepository = {
  async findById(id: number): Promise<Category | undefined> {
    const result = await query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS}
       FROM categories
       WHERE id = $1
       LIMIT 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? toCategory(row) : undefined;
  },

  async findActiveById(id: number): Promise<Category | undefined> {
    const result = await query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS}
       FROM categories
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? toCategory(row) : undefined;
  },

  async findByName(name: string): Promise<Category | undefined> {
    const result = await query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS}
       FROM categories
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [name.trim()],
    );

    const row = result.rows[0];
    return row ? toCategory(row) : undefined;
  },

  async findAll(includeInactive: boolean): Promise<Category[]> {
    const filter = includeInactive ? "" : "WHERE is_active = TRUE";
    const result = await query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS}
       FROM categories
       ${filter}
       ORDER BY name ASC`,
    );

    return result.rows.map(toCategory);
  },

  async create(input: CategoryInput): Promise<Category> {
    const result = await query<CategoryRow>(
      `INSERT INTO categories (name, description, is_active)
       VALUES ($1, $2, $3)
       RETURNING ${CATEGORY_COLUMNS}`,
      [input.name, input.description, input.isActive],
    );

    const created = result.rows[0];

    if (!created) {
      throw new Error("PostgreSQL no devolvió la categoría creada.");
    }

    return toCategory(created);
  },

  async update(id: number, input: CategoryInput): Promise<Category | undefined> {
    const result = await query<CategoryRow>(
      `UPDATE categories
       SET name = $2,
           description = $3,
           is_active = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${CATEGORY_COLUMNS}`,
      [id, input.name, input.description, input.isActive],
    );

    const row = result.rows[0];
    return row ? toCategory(row) : undefined;
  },

  async softDelete(id: number): Promise<Category | undefined> {
    const result = await query<CategoryRow>(
      `UPDATE categories
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${CATEGORY_COLUMNS}`,
      [id],
    );

    const row = result.rows[0];
    return row ? toCategory(row) : undefined;
  },
};
