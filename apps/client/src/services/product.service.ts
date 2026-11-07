import { authenticatedRequest } from "./api-client.ts";
import type {
  PaginatedProducts,
  Product,
  ProductListParams,
  ProductPayload,
  UpdateProductPayload,
} from "../types/product.types.ts";

interface ProductResponse {
  product: Product;
}

const buildListQuery = (params: ProductListParams): string => {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.categoryId !== undefined) {
    searchParams.set("categoryId", String(params.categoryId));
  }

  if (params.tagId !== undefined) {
    searchParams.set("tagId", String(params.tagId));
  }

  if (params.isActive !== undefined) {
    searchParams.set(
      "isActive",
      params.isActive === "all" ? "all" : String(params.isActive),
    );
  }

  if (params.lowStock) {
    searchParams.set("lowStock", "true");
  }

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const productService = {
  list(
    params: ProductListParams,
    signal?: AbortSignal,
  ): Promise<PaginatedProducts> {
    return authenticatedRequest<PaginatedProducts>(
      `/products${buildListQuery(params)}`,
      { signal },
    );
  },

  async getById(id: number): Promise<Product> {
    const response = await authenticatedRequest<ProductResponse>(
      `/products/${id}`,
    );

    return response.product;
  },

  async create(payload: ProductPayload): Promise<Product> {
    const response = await authenticatedRequest<ProductResponse>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.product;
  },

  async update(id: number, payload: UpdateProductPayload): Promise<Product> {
    const response = await authenticatedRequest<ProductResponse>(
      `/products/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return response.product;
  },

  async remove(id: number): Promise<Product> {
    const response = await authenticatedRequest<ProductResponse>(
      `/products/${id}`,
      { method: "DELETE" },
    );

    return response.product;
  },
};
