import type { SortDir } from "./sort.types.ts";

export const PRODUCT_SORT_FIELDS = [
  "name",
  "category",
  "price",
  "stock",
  "isActive",
] as const;

export type ProductSortBy = (typeof PRODUCT_SORT_FIELDS)[number];

export interface ProductCategorySummary {
  id: number;
  name: string;
}

export interface ProductTagSummary {
  id: number;
  name: string;
  color: string;
}

export interface Product {
  id: number;
  categoryId: number;
  category: ProductCategorySummary | null;
  name: string;
  description: string | null;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  lowStock: boolean;
  isActive: boolean;
  tags: ProductTagSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: ProductPagination;
}

export type ProductStatusFilter = "all" | boolean;

export interface ProductListParams {
  search?: string;
  categoryId?: number;
  tagId?: number;
  isActive?: ProductStatusFilter;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: ProductSortBy;
  sortDir?: SortDir;
}

export interface ProductPayload {
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  tagIds: number[];
}

export type UpdateProductPayload = Partial<ProductPayload>;
