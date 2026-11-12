import { authenticatedRequest } from "./api-client.ts";
import { notifyCatalogChanged } from "./catalog.service.ts";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/catalog.types.ts";

interface CategoryResponse {
  category: Category;
}

interface CategoriesResponse {
  categories: Category[];
}

export const categoryService = {
  async list(
    includeInactive: boolean,
    signal?: AbortSignal,
  ): Promise<Category[]> {
    const query = includeInactive ? "?includeInactive=true" : "";
    const response = await authenticatedRequest<CategoriesResponse>(
      `/categories${query}`,
      { signal },
    );

    return response.categories;
  },

  async getById(id: number): Promise<Category> {
    const response = await authenticatedRequest<CategoryResponse>(
      `/categories/${id}`,
    );

    return response.category;
  },

  async create(payload: CreateCategoryPayload): Promise<Category> {
    const response = await authenticatedRequest<CategoryResponse>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    notifyCatalogChanged();

    return response.category;
  },

  async update(id: number, payload: UpdateCategoryPayload): Promise<Category> {
    const response = await authenticatedRequest<CategoryResponse>(
      `/categories/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    notifyCatalogChanged();

    return response.category;
  },

  async remove(id: number): Promise<Category> {
    const response = await authenticatedRequest<CategoryResponse>(
      `/categories/${id}`,
      { method: "DELETE" },
    );

    notifyCatalogChanged();

    return response.category;
  },
};
