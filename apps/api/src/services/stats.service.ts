import { statsRepository } from "../repositories/stats.repository.ts";
import type {
  OverviewStats,
  StatsPeriod,
  StatsResponse,
  StatsSummaryProduct,
  TopProduct,
} from "../types/stats.types.ts";

const roundCurrency = (value: number): string => value.toFixed(2);

const toAverageTicket = (revenue: string, operations: number): string => {
  if (operations === 0) {
    return "0.00";
  }

  return roundCurrency(Number(revenue) / operations);
};

const percentChange = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
};

const toTopProducts = (
  rows: { productId: number; name: string; units: number; revenue: string }[],
): TopProduct[] => {
  const totalUnits = rows.reduce((total, row) => total + row.units, 0);

  return rows.map((row) => ({
    productId: row.productId,
    name: row.name,
    units: row.units,
    revenue: row.revenue,
    share: totalUnits === 0 ? 0 : (row.units / totalUnits) * 100,
  }));
};

const toSummaryProduct = (
  row: Omit<TopProduct, "share"> | undefined,
): Omit<TopProduct, "share"> | null => {
  if (!row) {
    return null;
  }

  return {
    productId: row.productId,
    name: row.name,
    units: row.units,
    revenue: row.revenue,
  };
};

const toBestMarginProduct = (
  row:
    | { name: string; profit: string; revenue: string }
    | undefined,
): StatsSummaryProduct | null => {
  if (!row) {
    return null;
  }

  const revenue = Number(row.revenue);
  const profit = Number(row.profit);

  return {
    name: row.name,
    profit: row.profit,
    marginPercent: revenue === 0 ? 0 : (profit / revenue) * 100,
  };
};

export const statsService = {
  async getOverview(): Promise<OverviewStats> {
    const overview = await statsRepository.getOverview();

    return {
      sales: {
        count: overview.sales.operations,
        revenue: overview.sales.revenue,
        averageTicket: toAverageTicket(
          overview.sales.revenue,
          overview.sales.operations,
        ),
      },
      lowStockCount: overview.lowStockCount,
      monthlyRevenue: overview.monthlyRevenue,
      lowStockProducts: overview.lowStockProducts,
      recentSales: overview.recentSales,
    };
  },

  async getStats(period: StatsPeriod): Promise<StatsResponse> {
    const data = await statsRepository.getPeriod(period);
    const currentRevenue = Number(data.current.revenue);
    const previousRevenue = Number(data.previous.revenue);
    const currentProfit = Number(data.currentProfit);
    const previousProfit = Number(data.previousProfit);
    const cancelledAmount = Number(data.cancelled.amount);
    const totalOperations = data.current.operations + data.cancelled.count;
    const topProducts = toTopProducts(data.topProducts);

    return {
      period,
      totals: {
        revenue: data.current.revenue,
        operations: data.current.operations,
        averageTicket: toAverageTicket(
          data.current.revenue,
          data.current.operations,
        ),
        estimatedProfit: data.currentProfit,
        cancelledAmount: data.cancelled.amount,
        cancelledCount: data.cancelled.count,
      },
      variations: {
        revenuePercent: percentChange(currentRevenue, previousRevenue),
        profitPercent: percentChange(currentProfit, previousProfit),
        operationsPercent: percentChange(
          data.current.operations,
          data.previous.operations,
        ),
        cancellationRate:
          totalOperations === 0
            ? 0
            : (data.cancelled.count / totalOperations) * 100,
      },
      monthlyRevenue: data.monthlyRevenue,
      topProducts,
      topProduct: toSummaryProduct(topProducts[0]),
      topRevenueProduct: toSummaryProduct(data.topRevenueProduct),
      bestMarginProduct: toBestMarginProduct(data.bestMargin),
    };
  },
};
