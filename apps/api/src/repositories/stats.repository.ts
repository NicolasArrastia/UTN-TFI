import type { QueryResultRow } from "pg";
import { query } from "../config/database.ts";
import type {
  LowStockProduct,
  MonthlyRevenue,
  RecentSale,
  StatsPeriod,
} from "../types/stats.types.ts";

const RECENT_SALES_LIMIT = 5;
const LOW_STOCK_LIMIT = 5;
const MONTHLY_REVENUE_MONTHS = 6;
const TOP_PRODUCTS_LIMIT = 5;

const PERIOD_INTERVALS: Record<
  StatsPeriod,
  { trunc: string; previous: string }
> = {
  month: { trunc: "month", previous: "1 month" },
  quarter: { trunc: "quarter", previous: "3 months" },
  year: { trunc: "year", previous: "1 year" },
};

interface SalesTotalsRow extends QueryResultRow {
  operations: number;
  revenue: string;
}

interface ProfitRow extends QueryResultRow {
  profit: string;
}

interface CancelledRow extends QueryResultRow {
  amount: string;
  count: number;
}

interface MonthlyRevenueRow extends QueryResultRow {
  month: string;
  total: string;
}

interface LowStockRow extends QueryResultRow {
  id: number;
  name: string;
  stock: number;
  minStock: number;
}

interface RecentSaleRow extends QueryResultRow {
  id: number;
  number: number;
  paymentMethod: string;
  total: string;
  status: "completed" | "cancelled";
  createdAt: Date;
  itemCount: number;
}

interface TopProductRow extends QueryResultRow {
  productId: number;
  name: string;
  units: number;
  revenue: string;
}

interface BestMarginRow extends QueryResultRow {
  name: string;
  profit: string;
  revenue: string;
}

const toRecentSale = (row: RecentSaleRow): RecentSale => ({
  id: row.id,
  number: row.number,
  paymentMethod: row.paymentMethod,
  total: row.total,
  status: row.status,
  createdAt: new Date(row.createdAt).toISOString(),
  itemCount: row.itemCount,
});

const toLowStockProduct = (row: LowStockRow): LowStockProduct => ({
  id: row.id,
  name: row.name,
  stock: row.stock,
  minStock: row.minStock,
});

const findMonthlyRevenue = async (): Promise<MonthlyRevenue[]> => {
  const { rows } = await query<MonthlyRevenueRow>(
    `WITH months AS (
       SELECT generate_series(
         date_trunc('month', NOW()) - interval '${MONTHLY_REVENUE_MONTHS - 1} months',
         date_trunc('month', NOW()),
         interval '1 month'
       ) AS month
     )
     SELECT to_char(months.month, 'YYYY-MM') AS month,
            COALESCE(SUM(sales.total), 0)::text AS total
     FROM months
     LEFT JOIN public.sales
       ON sales.status = 'completed'
      AND date_trunc('month', sales.created_at) = months.month
     GROUP BY months.month
     ORDER BY months.month`,
  );

  return rows.map((row) => ({ month: row.month, total: row.total }));
};

const findCurrentPeriodTotals = async (
  period: StatsPeriod,
): Promise<SalesTotalsRow> => {
  const { rows } = await query<SalesTotalsRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT COUNT(*)::int AS operations,
            COALESCE(SUM(sales.total), 0)::text AS revenue
     FROM public.sales, bounds
     WHERE sales.status = 'completed'
       AND sales.created_at >= bounds.start`,
    [PERIOD_INTERVALS[period].trunc],
  );

  return rows[0] ?? { operations: 0, revenue: "0" };
};

const findPreviousPeriodTotals = async (
  period: StatsPeriod,
): Promise<SalesTotalsRow> => {
  const { rows } = await query<SalesTotalsRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT COUNT(*)::int AS operations,
            COALESCE(SUM(sales.total), 0)::text AS revenue
     FROM public.sales, bounds
     WHERE sales.status = 'completed'
       AND sales.created_at >= bounds.start - $2::interval
       AND sales.created_at < bounds.start`,
    [PERIOD_INTERVALS[period].trunc, PERIOD_INTERVALS[period].previous],
  );

  return rows[0] ?? { operations: 0, revenue: "0" };
};

const findEstimatedProfit = async (
  period: StatsPeriod,
  isCurrent: boolean,
): Promise<string> => {
  const { rows } = await query<ProfitRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT COALESCE(
              SUM((sale_products.unit_price - sale_products.unit_cost) * sale_products.quantity),
              0
            )::text AS profit
     FROM public.sale_products
     JOIN public.sales ON sales.id = sale_products.sale_id, bounds
     WHERE sales.status = 'completed'
       AND ${isCurrent ? "sales.created_at >= bounds.start" : "sales.created_at >= bounds.start - $2::interval AND sales.created_at < bounds.start"}`,
    isCurrent
      ? [PERIOD_INTERVALS[period].trunc]
      : [PERIOD_INTERVALS[period].trunc, PERIOD_INTERVALS[period].previous],
  );

  return rows[0]?.profit ?? "0";
};

const findCancelledTotals = async (
  period: StatsPeriod,
): Promise<CancelledRow> => {
  const { rows } = await query<CancelledRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT COALESCE(SUM(sales.total), 0)::text AS amount,
            COUNT(*)::int AS count
     FROM public.sales, bounds
     WHERE sales.status = 'cancelled'
       AND sales.created_at >= bounds.start`,
    [PERIOD_INTERVALS[period].trunc],
  );

  return rows[0] ?? { amount: "0", count: 0 };
};

const findTopProducts = async (
  period: StatsPeriod,
): Promise<TopProductRow[]> => {
  const { rows } = await query<TopProductRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT sale_products.product_id AS "productId",
            sale_products.product_name AS name,
            SUM(sale_products.quantity)::int AS units,
            SUM(sale_products.subtotal)::text AS revenue
     FROM public.sale_products
     JOIN public.sales ON sales.id = sale_products.sale_id, bounds
     WHERE sales.status = 'completed'
       AND sales.created_at >= bounds.start
     GROUP BY sale_products.product_id, sale_products.product_name
     ORDER BY SUM(sale_products.quantity) DESC, SUM(sale_products.subtotal) DESC
     LIMIT ${TOP_PRODUCTS_LIMIT}`,
    [PERIOD_INTERVALS[period].trunc],
  );

  return rows;
};

const findTopRevenueProduct = async (
  period: StatsPeriod,
): Promise<TopProductRow | undefined> => {
  const { rows } = await query<TopProductRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT sale_products.product_id AS "productId",
            sale_products.product_name AS name,
            SUM(sale_products.quantity)::int AS units,
            SUM(sale_products.subtotal)::text AS revenue
     FROM public.sale_products
     JOIN public.sales ON sales.id = sale_products.sale_id, bounds
     WHERE sales.status = 'completed'
       AND sales.created_at >= bounds.start
     GROUP BY sale_products.product_id, sale_products.product_name
     ORDER BY SUM(sale_products.subtotal) DESC, SUM(sale_products.quantity) DESC
     LIMIT 1`,
    [PERIOD_INTERVALS[period].trunc],
  );

  return rows[0];
};

const findBestMarginProduct = async (
  period: StatsPeriod,
): Promise<BestMarginRow | undefined> => {
  const { rows } = await query<BestMarginRow>(
    `WITH bounds AS (SELECT date_trunc($1, NOW()) AS start)
     SELECT sale_products.product_name AS name,
            SUM((sale_products.unit_price - sale_products.unit_cost) * sale_products.quantity)::text AS profit,
            SUM(sale_products.subtotal)::text AS revenue
     FROM public.sale_products
     JOIN public.sales ON sales.id = sale_products.sale_id, bounds
     WHERE sales.status = 'completed'
       AND sales.created_at >= bounds.start
     GROUP BY sale_products.product_id, sale_products.product_name
     ORDER BY SUM((sale_products.unit_price - sale_products.unit_cost) * sale_products.quantity) DESC
     LIMIT 1`,
    [PERIOD_INTERVALS[period].trunc],
  );

  return rows[0];
};

export const statsRepository = {
  async getOverview() {
    const [totals, lowStockCountResult, monthlyRevenue, lowStock, recent] =
      await Promise.all([
        query<SalesTotalsRow>(
          `SELECT COUNT(*)::int AS operations,
                  COALESCE(SUM(total), 0)::text AS revenue
           FROM public.sales
           WHERE status = 'completed'
             AND created_at >= date_trunc('month', NOW())`,
        ),
        query<{ total: number }>(
          `SELECT COUNT(*)::int AS total
           FROM public.products
           WHERE is_active = TRUE AND stock <= min_stock`,
        ),
        findMonthlyRevenue(),
        query<LowStockRow>(
          `SELECT id, name, stock, min_stock AS "minStock"
           FROM public.products
           WHERE is_active = TRUE AND stock <= min_stock
           ORDER BY (min_stock - stock) DESC, lower(name) ASC
           LIMIT ${LOW_STOCK_LIMIT}`,
        ),
        query<RecentSaleRow>(
          `SELECT sales.id,
                  sales.number,
                  sales.payment_method AS "paymentMethod",
                  sales.total::text AS total,
                  sales.status,
                  sales.created_at AS "createdAt",
                  COUNT(sale_products.product_id)::int AS "itemCount"
           FROM public.sales
           LEFT JOIN public.sale_products
             ON sale_products.sale_id = sales.id
           GROUP BY sales.id
           ORDER BY sales.created_at DESC, sales.id DESC
           LIMIT ${RECENT_SALES_LIMIT}`,
        ),
      ]);

    return {
      sales: totals.rows[0] ?? { operations: 0, revenue: "0" },
      lowStockCount: lowStockCountResult.rows[0]?.total ?? 0,
      monthlyRevenue,
      lowStockProducts: lowStock.rows.map(toLowStockProduct),
      recentSales: recent.rows.map(toRecentSale),
    };
  },

  async getPeriod(period: StatsPeriod) {
    const [
      current,
      previous,
      currentProfit,
      previousProfit,
      cancelled,
      monthlyRevenue,
      topProducts,
      topRevenueProduct,
      bestMargin,
    ] = await Promise.all([
      findCurrentPeriodTotals(period),
      findPreviousPeriodTotals(period),
      findEstimatedProfit(period, true),
      findEstimatedProfit(period, false),
      findCancelledTotals(period),
      findMonthlyRevenue(),
      findTopProducts(period),
      findTopRevenueProduct(period),
      findBestMarginProduct(period),
    ]);

    return {
      current,
      previous,
      currentProfit,
      previousProfit,
      cancelled,
      monthlyRevenue,
      topProducts,
      topRevenueProduct,
      bestMargin,
    };
  },
};
