import { authenticatedRequest } from "./api-client.ts";
import type { Category, Tag } from "../types/catalog.types.ts";

interface CategoriesResponse {
  categories: Category[];
}

interface TagsResponse {
  tags: Tag[];
}

export const catalogService = {
  async listCategories(): Promise<Category[]> {
    const response = await authenticatedRequest<CategoriesResponse>("/categories");
    return response.categories;
  },

  async listTags(): Promise<Tag[]> {
    const response = await authenticatedRequest<TagsResponse>("/tags");
    return response.tags;
  },
};
