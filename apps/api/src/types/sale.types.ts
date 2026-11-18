import type { SortDir } from "./sort.types.ts";

export const PAYMENT_METHODS = ["cash", "transfer", "card", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SALE_STATUSES = ["completed", "cancelled"] as const;

export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_SORT_FIELDS = [
  "number",
  "createdAt",
  "user",
  "total",
  "paymentMethod",
  "status",
] as const;

export type SaleSortBy = (typeof SALE_SORT_FIELDS)[number];

export interface SaleItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleInput {
  paymentMethod: PaymentMethod;
  items: SaleItemInput[];
}

export interface SaleItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface SaleResponse {
  id: number;
  number: number;
  userId: number;
  paymentMethod: PaymentMethod;
  total: string;
  status: "completed";
  createdAt: string;
  items: SaleItemResponse[];
}

/** Filtros, orden y paginación ya validados del historial. */
export interface SaleListQuery {
  page: number;
  limit: number;
  sortBy: SaleSortBy;
  sortDir: SortDir;
  userId?: number;
  from?: string;
  to?: string;
  status?: SaleStatus;
}

export interface SaleListSummary {
  completedCount: number;
  completedTotal: string;
  cancelledCount: number;
}
