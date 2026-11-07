export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  tagIds: number[];
  createdAt: string;
  updatedAt: string;
}

/** Datos de negocio completos que recibe el repositorio para crear o reemplazar. */
export interface ProductInput {
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

/** Campos que el cliente puede enviar al modificar un producto. */
export interface UpdateProductInput {
  categoryId?: number;
  name?: string;
  description?: string | null;
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  isActive?: boolean;
  tagIds?: number[];
}

/** Filtros y paginación ya validados del listado. */
export interface ProductListQuery {
  search?: string;
  categoryId?: number;
  tagId?: number;
  isActive: "all" | boolean;
  lowStock: boolean;
  page: number;
  limit: number;
}

export interface ProductCategorySummary {
  id: number;
  name: string;
}

export interface ProductTagSummary {
  id: number;
  name: string;
  color: string;
}

export interface ProductResponse {
  id: number;
  categoryId: number;
  category: ProductCategorySummary | null;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  lowStock: boolean;
  isActive: boolean;
  tags: ProductTagSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  products: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
