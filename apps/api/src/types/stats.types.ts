export const STATS_PERIODS = ["month", "quarter", "year"] as const;

export type StatsPeriod = (typeof STATS_PERIODS)[number];

export interface MonthlyRevenue {
  month: string;
  total: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  minStock: number;
}

export interface RecentSale {
  id: number;
  number: number;
  paymentMethod: string;
  total: string;
  status: "completed" | "cancelled";
  createdAt: string;
  itemCount: number;
}

export interface OverviewStats {
  sales: {
    count: number;
    revenue: string;
    averageTicket: string;
  };
  lowStockCount: number;
  monthlyRevenue: MonthlyRevenue[];
  lowStockProducts: LowStockProduct[];
  recentSales: RecentSale[];
}

export interface StatsTotals {
  revenue: string;
  operations: number;
  averageTicket: string;
  estimatedProfit: string;
  cancelledAmount: string;
  cancelledCount: number;
}

export interface StatsVariations {
  revenuePercent: number | null;
  profitPercent: number | null;
  operationsPercent: number | null;
  cancellationRate: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  units: number;
  revenue: string;
  share: number;
}

export interface StatsSummaryProduct {
  name: string;
  profit: string;
  marginPercent: number;
}

export interface StatsResponse {
  period: StatsPeriod;
  totals: StatsTotals;
  variations: StatsVariations;
  monthlyRevenue: MonthlyRevenue[];
  topProducts: TopProduct[];
  topProduct: Omit<TopProduct, "share"> | null;
  bestMarginProduct: StatsSummaryProduct | null;
}
