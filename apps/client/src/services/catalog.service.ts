import { authenticatedRequest } from "./api-client.ts";
import type { Category, Tag } from "../types/catalog.types.ts";

interface CategoriesResponse {
  categories: Category[];
}

interface TagsResponse {
  tags: Tag[];
}

export const CATALOG_CHANGED_EVENT = "catalog:changed";

/**
 * Avisa a los hooks que consumen el catálogo que los datos cambiaron.
 * Las mutaciones de etiquetas lo emiten para que los formularios de productos
 * no trabajen con una lista desactualizada.
 */
export const notifyCatalogChanged = (): void => {
  window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT));
};

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
