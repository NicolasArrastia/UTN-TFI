import type { PoolClient, QueryResultRow } from "pg";
import { query, withTransaction } from "../config/database.ts";
import type {
  Product,
  ProductInput,
  ProductListQuery,
} from "../types/product.types.ts";

interface ProductRow extends QueryResultRow {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: string;
  cost: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tagIds: number[];
}

interface IdRow extends QueryResultRow {
  id: number;
}

const PRODUCT_COLUMNS = `
  p.id,
  p.category_id AS "categoryId",
  p.name,
  p.description,
  p.price::text AS price,
  p.cost::text AS cost,
  p.stock,
  p.min_stock AS "minStock",
  p.is_active AS "isActive",
  p.created_at AS "createdAt",
  p.updated_at AS "updatedAt",
  COALESCE(
    array_agg(pt.tag_id ORDER BY pt.tag_id) FILTER (WHERE pt.tag_id IS NOT NULL),
    '{}'
  ) AS "tagIds"
`;

const PRODUCT_SELECT = `
  SELECT ${PRODUCT_COLUMNS}
  FROM public.products AS p
  LEFT JOIN public.product_tags AS pt ON pt.product_id = p.id
`;

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  categoryId: row.categoryId,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  cost: Number(row.cost),
  stock: row.stock,
  minStock: row.minStock,
  isActive: row.isActive,
  tagIds: row.tagIds,
  createdAt: new Date(row.createdAt).toISOString(),
  updatedAt: new Date(row.updatedAt).toISOString(),
});

interface FilterClause {
  conditions: string[];
  values: unknown[];
}

const buildFilterClause = (filters: ProductListQuery): FilterClause => {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const addCondition = (condition: (placeholder: string) => string, value: unknown) => {
    values.push(value);
    conditions.push(condition(`$${values.length}`));
  };

  if (filters.isActive !== "all") {
    addCondition((placeholder) => `p.is_active = ${placeholder}`, filters.isActive);
  }

  if (filters.categoryId !== undefined) {
    addCondition(
      (placeholder) => `p.category_id = ${placeholder}`,
      filters.categoryId,
    );
  }

  if (filters.tagId !== undefined) {
    addCondition(
      (placeholder) =>
        `EXISTS (
           SELECT 1
           FROM public.product_tags AS filter_tags
           WHERE filter_tags.product_id = p.id
             AND filter_tags.tag_id = ${placeholder}
         )`,
      filters.tagId,
    );
  }

  if (filters.lowStock) {
    conditions.push("p.stock <= p.min_stock");
  }

  if (filters.search !== undefined) {
    addCondition(
      (placeholder) => `strpos(lower(p.name), lower(${placeholder})) > 0`,
      filters.search,
    );
  }

  return { conditions, values };
};

const toWhereClause = (conditions: string[]): string =>
  conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

const findById = async (id: number): Promise<Product | undefined> => {
  const { rows } = await query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.id = $1
     GROUP BY p.id
     LIMIT 1`,
    [id],
  );

  const row = rows[0];
  return row ? toProduct(row) : undefined;
};

const insertTags = async (
  client: PoolClient,
  productId: number,
  tagIds: number[],
): Promise<void> => {
  if (tagIds.length === 0) {
    return;
  }

  await client.query(
    `INSERT INTO public.product_tags (product_id, tag_id)
     SELECT $1, unnest($2::integer[])`,
    [productId, tagIds],
  );
};

export const productRepository = {
  async findAll(
    filters: ProductListQuery,
  ): Promise<{ items: Product[]; total: number }> {
    const { conditions, values } = buildFilterClause(filters);
    const where = toWhereClause(conditions);
    const offset = (filters.page - 1) * filters.limit;

    const [products, count] = await Promise.all([
      query<ProductRow>(
        `${PRODUCT_SELECT}
         ${where}
         GROUP BY p.id
         ORDER BY lower(p.name) ASC, p.id ASC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, filters.limit, offset],
      ),
      query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM public.products AS p
         ${where}`,
        values,
      ),
    ]);

    return {
      items: products.rows.map(toProduct),
      total: count.rows[0]?.total ?? 0,
    };
  },

  findById,

  async countActiveByCategoryId(categoryId: number): Promise<number> {
    const { rows } = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
       FROM public.products
       WHERE category_id = $1 AND is_active = TRUE`,
      [categoryId],
    );

    return rows[0]?.total ?? 0;
  },

  async create(input: ProductInput): Promise<Product> {
    const id = await withTransaction(async (client) => {
      const { rows } = await client.query<IdRow>(
        `INSERT INTO public.products
           (category_id, name, description, price, cost, stock, min_stock, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          input.categoryId,
          input.name,
          input.description,
          input.price,
          input.cost,
          input.stock,
          input.minStock,
          input.isActive,
        ],
      );

      const created = rows[0];

      if (!created) {
        throw new Error("PostgreSQL no devolvió el producto creado.");
      }

      await insertTags(client, created.id, input.tagIds);
      return created.id;
    });

    const product = await findById(id);

    if (!product) {
      throw new Error("PostgreSQL no devolvió el producto creado.");
    }

    return product;
  },

  async replace(id: number, input: ProductInput): Promise<Product | undefined> {
    const updated = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE public.products
         SET category_id = $2,
             name = $3,
             description = $4,
             price = $5,
             cost = $6,
             stock = $7,
             min_stock = $8,
             is_active = $9,
             updated_at = NOW()
         WHERE id = $1`,
        [
          id,
          input.categoryId,
          input.name,
          input.description,
          input.price,
          input.cost,
          input.stock,
          input.minStock,
          input.isActive,
        ],
      );

      if ((result.rowCount ?? 0) === 0) {
        return false;
      }

      await client.query(
        "DELETE FROM public.product_tags WHERE product_id = $1",
        [id],
      );
      await insertTags(client, id, input.tagIds);

      return true;
    });

    return updated ? findById(id) : undefined;
  },

  async deactivate(id: number): Promise<Product | undefined> {
    const { rows } = await query<IdRow>(
      `UPDATE public.products
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [id],
    );

    return rows[0] ? findById(id) : undefined;
  },
};
