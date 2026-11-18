import type { SortDir } from "./sort.types.ts";

export const SALE_SORT_FIELDS = [
  "number",
  "createdAt",
  "user",
  "total",
  "paymentMethod",
  "status",
] as const;

export type SaleSortBy = (typeof SALE_SORT_FIELDS)[number];

export const SALE_STATUSES = ["completed", "cancelled"] as const;

export type SaleStatus = (typeof SALE_STATUSES)[number];

export type SaleStatusFilter = "all" | SaleStatus;

export interface SaleBase {
  id: number;
  number: number;
  userId: number;
  paymentMethod: string;
  total: string;
  status: SaleStatus;
  createdAt: string;
  cancelledAt: string | null;
  cancelledBy: number | null;
  cancellationReason: string | null;
}

export interface SaleSummary extends SaleBase {
  userName: string | null;
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface SaleDetail extends SaleBase {
  items: SaleItem[];
}

export interface SaleListSummary {
  completedCount: number;
  completedTotal: string;
  cancelledCount: number;
}

export interface SalesResponse {
  sales: SaleSummary[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
  summary: SaleListSummary;
}

export interface SaleListParams {
  page?: number;
  limit?: number;
  sortBy?: SaleSortBy;
  sortDir?: SortDir;
  userId?: number;
  from?: string;
  to?: string;
  status?: SaleStatus;
}

export interface CancelledSale {
  id: number;
  status: SaleStatus;
  cancelledAt: string;
  cancelledBy: number;
  cancellationReason: string;
}
