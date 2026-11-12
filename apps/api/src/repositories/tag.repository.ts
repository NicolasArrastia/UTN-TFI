import type { QueryResultRow } from "pg";
import { query } from "../config/database.ts";
import type { Tag, TagInput } from "../types/tag.types.ts";

interface TagRow extends QueryResultRow {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TAG_COLUMNS = `
  id,
  name,
  color,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const toTag = (row: TagRow): Tag => ({
  id: row.id,
  name: row.name,
  color: row.color,
  isActive: row.isActive,
  createdAt: new Date(row.createdAt).toISOString(),
  updatedAt: new Date(row.updatedAt).toISOString(),
});

export const tagRepository = {
  async findById(id: number): Promise<Tag | undefined> {
    const result = await query<TagRow>(
      `SELECT ${TAG_COLUMNS}
       FROM tags
       WHERE id = $1
       LIMIT 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? toTag(row) : undefined;
  },

  async findActiveById(id: number): Promise<Tag | undefined> {
    const result = await query<TagRow>(
      `SELECT ${TAG_COLUMNS}
       FROM tags
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? toTag(row) : undefined;
  },

  async findByName(name: string): Promise<Tag | undefined> {
    const result = await query<TagRow>(
      `SELECT ${TAG_COLUMNS}
       FROM tags
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [name.trim()],
    );

    const row = result.rows[0];
    return row ? toTag(row) : undefined;
  },

  async findAll(includeInactive: boolean): Promise<Tag[]> {
    const filter = includeInactive ? "" : "WHERE is_active = TRUE";
    const result = await query<TagRow>(
      `SELECT ${TAG_COLUMNS}
       FROM tags
       ${filter}
       ORDER BY name ASC`,
    );

    return result.rows.map(toTag);
  },

  async create(input: TagInput): Promise<Tag> {
    const result = await query<TagRow>(
      `INSERT INTO tags (name, color, is_active)
       VALUES ($1, $2, $3)
       RETURNING ${TAG_COLUMNS}`,
      [input.name, input.color, input.isActive],
    );

    const created = result.rows[0];

    if (!created) {
      throw new Error("PostgreSQL no devolvió la etiqueta creada.");
    }

    return toTag(created);
  },

  async update(id: number, input: TagInput): Promise<Tag | undefined> {
    const result = await query<TagRow>(
      `UPDATE tags
       SET name = $2,
           color = $3,
           is_active = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${TAG_COLUMNS}`,
      [id, input.name, input.color, input.isActive],
    );

    const row = result.rows[0];
    return row ? toTag(row) : undefined;
  },

  async softDelete(id: number): Promise<Tag | undefined> {
    const result = await query<TagRow>(
      `UPDATE tags
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${TAG_COLUMNS}`,
      [id],
    );

    const row = result.rows[0];
    return row ? toTag(row) : undefined;
  },
};
