import type { PoolClient, QueryResultRow } from "pg";
import { query, withTransaction } from "../config/database.ts";
import type {
  Product,
  ProductInput,
  ProductListQuery,
  UpdateProductInput,
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
  tagIds: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProductIdRow extends QueryResultRow {
  id: number;
}

interface CountRow extends QueryResultRow {
  total: string;
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
  ARRAY(
    SELECT pt.tag_id
    FROM public.product_tags AS pt
    WHERE pt.product_id = p.id
    ORDER BY pt.tag_id
  ) AS "tagIds",
  p.created_at AS "createdAt",
  p.updated_at AS "updatedAt"
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

const findByIdWithClient = async (
  client: PoolClient,
  id: number,
): Promise<Product | undefined> => {
  const result = await client.query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM public.products AS p
     WHERE p.id = $1
     LIMIT 1`,
    [id],
  );

  const row = result.rows[0];
  return row ? toProduct(row) : undefined;
};

const replaceTags = async (
  client: PoolClient,
  productId: number,
  tagIds: number[],
): Promise<void> => {
  await client.query(
    "DELETE FROM public.product_tags WHERE product_id = $1",
    [productId],
  );

  if (tagIds.length === 0) {
    return;
  }

  await client.query(
    `INSERT INTO public.product_tags (product_id, tag_id)
     SELECT $1, tag_id
     FROM unnest($2::integer[]) AS tag_id`,
    [productId, tagIds],
  );
};

const buildFilters = (
  filters: ProductListQuery,
): { where: string; values: unknown[] } => {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const addValue = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.isActive !== "all") {
    conditions.push(`p.is_active = ${addValue(filters.isActive)}`);
  }

  if (filters.categoryId !== undefined) {
    conditions.push(`p.category_id = ${addValue(filters.categoryId)}`);
  }

  if (filters.tagId !== undefined) {
    const placeholder = addValue(filters.tagId);
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM public.product_tags AS filtered_tags
        WHERE filtered_tags.product_id = p.id
          AND filtered_tags.tag_id = ${placeholder}
      )`,
    );
  }

  if (filters.lowStock) {
    conditions.push("p.stock <= p.min_stock");
  }

  if (filters.search !== undefined) {
    const placeholder = addValue(filters.search);
    conditions.push(`strpos(lower(p.name), lower(${placeholder})) > 0`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};

const updateFields: {
  [K in Exclude<keyof UpdateProductInput, "tagIds">]: string;
} = {
  categoryId: "category_id",
  name: "name",
  description: "description",
  price: "price",
  cost: "cost",
  stock: "stock",
  minStock: "min_stock",
  isActive: "is_active",
};

export const productRepository = {
  async findAll(
    filters: ProductListQuery,
  ): Promise<{ items: Product[]; total: number }> {
    const { where, values } = buildFilters(filters);
    const offset = (filters.page - 1) * filters.limit;
    const limitPlaceholder = `$${values.length + 1}`;
    const offsetPlaceholder = `$${values.length + 2}`;

    const [productsResult, countResult] = await Promise.all([
      query<ProductRow>(
        `SELECT ${PRODUCT_COLUMNS}
         FROM public.products AS p
         ${where}
         ORDER BY lower(p.name), p.id
         LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
        [...values, filters.limit, offset],
      ),
      query<CountRow>(
        `SELECT COUNT(*)::text AS total
         FROM public.products AS p
         ${where}`,
        values,
      ),
    ]);

    return {
      items: productsResult.rows.map(toProduct),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  },

  async findById(id: number): Promise<Product | undefined> {
    const result = await query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS}
       FROM public.products AS p
       WHERE p.id = $1
       LIMIT 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? toProduct(row) : undefined;
  },

  async countActiveByCategoryId(categoryId: number): Promise<number> {
    const result = await query<CountRow>(
      `SELECT COUNT(*)::text AS total
       FROM public.products
       WHERE category_id = $1 AND is_active = TRUE`,
      [categoryId],
    );

    return Number(result.rows[0]?.total ?? 0);
  },

  async create(input: ProductInput): Promise<Product> {
    return withTransaction(async (client) => {
      const result = await client.query<ProductIdRow>(
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

      const created = result.rows[0];

      if (!created) {
        throw new Error("PostgreSQL no devolvió el producto creado.");
      }

      await replaceTags(client, created.id, input.tagIds);

      const product = await findByIdWithClient(client, created.id);

      if (!product) {
        throw new Error("No se pudo recuperar el producto creado.");
      }

      return product;
    });
  },

  async update(
    id: number,
    input: UpdateProductInput,
  ): Promise<Product | undefined> {
    return withTransaction(async (client) => {
      const assignments: string[] = [];
      const values: unknown[] = [id];

      for (const key of Object.keys(updateFields) as Array<
        keyof typeof updateFields
      >) {
        const value = input[key];

        if (value === undefined) {
          continue;
        }

        values.push(value);
        assignments.push(`${updateFields[key]} = $${values.length}`);
      }

      assignments.push("updated_at = NOW()");

      const result = await client.query<ProductIdRow>(
        `UPDATE public.products
         SET ${assignments.join(", ")}
         WHERE id = $1
         RETURNING id`,
        values,
      );

      if (!result.rows[0]) {
        return undefined;
      }

      if (input.tagIds !== undefined) {
        await replaceTags(client, id, input.tagIds);
      }

      return findByIdWithClient(client, id);
    });
  },

  async deactivate(id: number): Promise<Product | undefined> {
    return withTransaction(async (client) => {
      const result = await client.query<ProductIdRow>(
        `UPDATE public.products
         SET is_active = FALSE,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [id],
      );

      if (!result.rows[0]) {
        return undefined;
      }

      return findByIdWithClient(client, id);
    });
  },
};
