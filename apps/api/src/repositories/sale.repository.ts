import { query, withTransaction } from "../config/database.ts";
import { BUSINESS_TIME_ZONE } from "../config/env.ts";
import { AppError } from "../errors/app-error.ts";
import type {
  CreateSaleInput,
  PaymentMethod,
  SaleItemResponse,
  SaleListQuery,
  SaleResponse,
  SaleSortBy,
  SaleStatus,
} from "../types/sale.types.ts";
import type { SortDir } from "../types/sort.types.ts";

interface SaleRow {
  id: number;
  number: number;
  user_id: number;
  payment_method: PaymentMethod;
  total: string;
  status: SaleStatus;
  created_at: Date;
  cancelled_at: Date | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;
  user_name?: string | null;
}

interface SaleSummaryRow {
  completedCount: string;
  completedTotal: string;
  cancelledCount: string;
}

interface SaleItemRow {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface CatalogProductRow {
  id: number;
  name: string;
  price: string;
  stock: number;
}

interface SaleProductRow {
  id: number;
  name: string;
  price_in_cents: string;
  cost_in_cents: string;
  stock: number;
  is_active: boolean;
}

interface CreatedSaleRow {
  id: number;
  number: number;
  created_at: Date;
}

interface CancelledSaleRow {
  id: number;
  status: "cancelled";
  cancelled_at: Date;
  cancelled_by: number;
  cancellation_reason: string;
}

const MAX_TOTAL_IN_CENTS = 9_999_999_999n;

const saleColumns = `
  id, number, user_id, payment_method, total::text AS total, status,
  created_at, cancelled_at, cancelled_by, cancellation_reason
`;

const saleListColumns = `
  s.id, s.number, s.user_id, s.payment_method, s.total::text AS total, s.status,
  s.created_at, s.cancelled_at, s.cancelled_by, s.cancellation_reason,
  u.fullname AS user_name
`;

const LIST_JOIN = "LEFT JOIN public.users AS u ON u.id = s.user_id";

/**
 * Whitelist de ordenamiento: la clave recibida se resuelve a una expresión SQL
 * fija. Nunca se interpola el valor que manda el cliente.
 */
const SORT_EXPRESSIONS: Record<SaleSortBy, string> = {
  number: "s.number",
  createdAt: "s.created_at",
  user: "lower(u.fullname)",
  total: "s.total",
  paymentMethod: "s.payment_method",
  status: "s.status",
};

const toOrderBy = (sortBy: SaleSortBy, sortDir: SortDir): string =>
  `${SORT_EXPRESSIONS[sortBy]} ${sortDir === "asc" ? "ASC" : "DESC"} NULLS LAST, s.id`;

const buildSaleFilters = (
  queryFilters: SaleListQuery,
): { where: string; values: unknown[] } => {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const addValue = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  if (queryFilters.userId !== undefined) {
    conditions.push(`s.user_id = ${addValue(queryFilters.userId)}`);
  }

  if (queryFilters.status !== undefined) {
    conditions.push(`s.status = ${addValue(queryFilters.status)}`);
  }

  if (
    queryFilters.from !== undefined ||
    queryFilters.to !== undefined
  ) {
    // Los extremos son inclusivos y se interpretan en la hora argentina.
    const timeZone = addValue(BUSINESS_TIME_ZONE);

    if (queryFilters.from !== undefined) {
      conditions.push(
        `s.created_at >= (${addValue(queryFilters.from)}::date::timestamp AT TIME ZONE ${timeZone})`,
      );
    }

    if (queryFilters.to !== undefined) {
      conditions.push(
        `s.created_at < (((${addValue(queryFilters.to)}::date + 1)::timestamp) AT TIME ZONE ${timeZone})`,
      );
    }
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};

const toDecimal = (cents: bigint): string =>
  `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;

const toSaleSummary = (row: SaleRow) => ({
  id: row.id,
  number: row.number,
  userId: row.user_id,
  paymentMethod: row.payment_method,
  total: row.total,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  cancelledAt: row.cancelled_at?.toISOString() ?? null,
  cancelledBy: row.cancelled_by,
  cancellationReason: row.cancellation_reason,
});

const toSaleListItem = (row: SaleRow) => ({
  ...toSaleSummary(row),
  userName: row.user_name ?? null,
});

const toSaleItem = (row: SaleItemRow): SaleItemResponse => ({
  productId: row.product_id,
  productName: row.product_name,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  subtotal: row.subtotal,
});

export const saleRepository = {
  async listCatalog(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;

    const { rows } = await query<CatalogProductRow>(
      `SELECT id, name, price::text AS price, stock
       FROM public.products
       WHERE is_active = TRUE
         AND ($1::text = '' OR strpos(lower(name), lower($1::text)) > 0)
       ORDER BY lower(name), id
       LIMIT $2 OFFSET $3`,
      [search, limit + 1, offset],
    );

    return {
      products: rows.slice(0, limit),
      pagination: { page, limit, hasNextPage: rows.length > limit },
    };
  },

  async list(filters: SaleListQuery) {
    const { where, values } = buildSaleFilters(filters);
    const offset = (filters.page - 1) * filters.limit;
    const limitPlaceholder = `$${values.length + 1}`;
    const offsetPlaceholder = `$${values.length + 2}`;

    const [salesResult, summaryResult] = await Promise.all([
      query<SaleRow>(
        `SELECT ${saleListColumns}
         FROM public.sales AS s
         ${LIST_JOIN}
         ${where}
         ORDER BY ${toOrderBy(filters.sortBy, filters.sortDir)}
         LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
        [...values, filters.limit + 1, offset],
      ),
      query<SaleSummaryRow>(
        `SELECT
           COUNT(*) FILTER (WHERE s.status = 'completed')::text AS "completedCount",
           COALESCE(SUM(s.total) FILTER (WHERE s.status = 'completed'), 0)::text AS "completedTotal",
           COUNT(*) FILTER (WHERE s.status = 'cancelled')::text AS "cancelledCount"
         FROM public.sales AS s
         ${where}`,
        values,
      ),
    ]);

    const summary = summaryResult.rows[0];

    return {
      sales: salesResult.rows.slice(0, filters.limit).map(toSaleListItem),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        hasNextPage: salesResult.rows.length > filters.limit,
      },
      summary: {
        completedCount: Number(summary?.completedCount ?? 0),
        completedTotal: summary?.completedTotal ?? "0",
        cancelledCount: Number(summary?.cancelledCount ?? 0),
      },
    };
  },

  async findById(id: number, userId: number | null) {
    const {
      rows: [sale],
    } = await query<SaleRow>(
      `SELECT ${saleColumns}
       FROM public.sales
       WHERE id = $1 AND ($2::integer IS NULL OR user_id = $2)`,
      [id, userId],
    );

    if (!sale) {
      return null;
    }

    const { rows: items } = await query<SaleItemRow>(
      `SELECT product_id, product_name, quantity,
              unit_price::text AS unit_price, subtotal::text AS subtotal
       FROM public.sale_products
       WHERE sale_id = $1
       ORDER BY product_id`,
      [id],
    );

    return { ...toSaleSummary(sale), items: items.map(toSaleItem) };
  },

  async create(userId: number, input: CreateSaleInput): Promise<SaleResponse> {
    const quantities = new Map<number, number>();

    for (const { productId, quantity } of input.items) {
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const productIds = [...quantities.keys()].sort((a, b) => a - b);

    return withTransaction(async (client) => {
      const { rows: products } = await client.query<SaleProductRow>(
        `SELECT id, name, (price * 100)::bigint::text AS price_in_cents,
                (cost * 100)::bigint::text AS cost_in_cents,
                stock, is_active
         FROM public.products
         WHERE id = ANY($1::integer[])
         ORDER BY id
         FOR UPDATE`,
        [productIds],
      );

      const productsById = new Map(
        products.map((product) => [product.id, product] as const),
      );
      const items: Array<{ item: SaleItemResponse; unitCost: string }> = [];
      let totalInCents = 0n;

      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId);

        if (!product) {
          throw new AppError(
            `No se encontró el producto con ID ${productId}.`,
            404,
            "PRODUCT_NOT_FOUND",
          );
        }

        if (!product.is_active) {
          throw new AppError(
            `El producto "${product.name}" no está activo.`,
            409,
            "PRODUCT_INACTIVE",
          );
        }

        if (quantity > product.stock) {
          throw new AppError(
            `No hay stock suficiente para "${product.name}".`,
            409,
            "INSUFFICIENT_STOCK",
          );
        }

        const unitPriceInCents = BigInt(product.price_in_cents);
        const unitCostInCents = BigInt(product.cost_in_cents);
        const subtotalInCents = unitPriceInCents * BigInt(quantity);
        totalInCents += subtotalInCents;

        if (totalInCents > MAX_TOTAL_IN_CENTS) {
          throw new AppError(
            "El total de la venta supera el importe máximo permitido.",
            400,
            "SALE_TOTAL_OUT_OF_RANGE",
          );
        }

        items.push({
          item: {
            productId,
            productName: product.name,
            quantity,
            unitPrice: toDecimal(unitPriceInCents),
            subtotal: toDecimal(subtotalInCents),
          },
          unitCost: toDecimal(unitCostInCents),
        });
      }

      const total = toDecimal(totalInCents);
      const {
        rows: [sale],
      } = await client.query<CreatedSaleRow>(
        `INSERT INTO public.sales (user_id, number, payment_method, total)
         VALUES ($1, nextval('public.sale_number_seq'), $2, $3)
         RETURNING id, number, created_at`,
        [userId, input.paymentMethod, total],
      );

      if (!sale) {
        throw new AppError("No se pudo registrar la venta.");
      }

      for (const { item, unitCost } of items) {
        await client.query(
          `INSERT INTO public.sale_products
             (sale_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sale.id,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            unitCost,
            item.subtotal,
          ],
        );

        await client.query(
          `UPDATE public.products
           SET stock = stock - $1, updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.productId],
        );
      }

      return {
        id: sale.id,
        number: sale.number,
        userId,
        paymentMethod: input.paymentMethod,
        total,
        status: "completed",
        createdAt: sale.created_at.toISOString(),
        items: items.map(({ item }) => item),
      };
    });
  },

  async cancel(saleId: number, userId: number, reason: string) {
    return withTransaction(async (client) => {
      const {
        rows: [sale],
      } = await client.query<{ status: SaleStatus }>(
        `SELECT status
         FROM public.sales
         WHERE id = $1
         FOR UPDATE`,
        [saleId],
      );

      if (!sale) {
        throw new AppError("Venta no encontrada.", 404, "SALE_NOT_FOUND");
      }

      if (sale.status === "cancelled") {
        throw new AppError(
          "La venta ya está anulada.",
          409,
          "SALE_ALREADY_CANCELLED",
        );
      }

      await client.query(
        `SELECT p.id
         FROM public.products AS p
         JOIN public.sale_products AS sp ON sp.product_id = p.id
         WHERE sp.sale_id = $1
         ORDER BY p.id
         FOR UPDATE OF p`,
        [saleId],
      );

      await client.query(
        `UPDATE public.products AS p
         SET stock = p.stock + sp.quantity, updated_at = NOW()
         FROM public.sale_products AS sp
         WHERE sp.sale_id = $1 AND sp.product_id = p.id`,
        [saleId],
      );

      const {
        rows: [cancelledSale],
      } = await client.query<CancelledSaleRow>(
        `UPDATE public.sales
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancelled_by = $2,
             cancellation_reason = $3
         WHERE id = $1
         RETURNING id, status, cancelled_at, cancelled_by, cancellation_reason`,
        [saleId, userId, reason],
      );

      if (!cancelledSale) {
        throw new AppError("No se pudo anular la venta.");
      }

      return {
        id: cancelledSale.id,
        status: cancelledSale.status,
        cancelledAt: cancelledSale.cancelled_at.toISOString(),
        cancelledBy: cancelledSale.cancelled_by,
        cancellationReason: cancelledSale.cancellation_reason,
      };
    });
  },
};
