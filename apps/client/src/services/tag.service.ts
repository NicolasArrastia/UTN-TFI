import { authenticatedRequest } from "./api-client.ts";
import { notifyCatalogChanged } from "./catalog.service.ts";
import type {
  CreateTagPayload,
  Tag,
  UpdateTagPayload,
} from "../types/catalog.types.ts";

interface TagResponse {
  tag: Tag;
}

interface TagsResponse {
  tags: Tag[];
}

export const tagService = {
  async list(includeInactive: boolean, signal?: AbortSignal): Promise<Tag[]> {
    const query = includeInactive ? "?includeInactive=true" : "";
    const response = await authenticatedRequest<TagsResponse>(
      `/tags${query}`,
      { signal },
    );

    return response.tags;
  },

  async getById(id: number): Promise<Tag> {
    const response = await authenticatedRequest<TagResponse>(`/tags/${id}`);

    return response.tag;
  },

  async create(payload: CreateTagPayload): Promise<Tag> {
    const response = await authenticatedRequest<TagResponse>("/tags", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    notifyCatalogChanged();

    return response.tag;
  },

  async update(id: number, payload: UpdateTagPayload): Promise<Tag> {
    const response = await authenticatedRequest<TagResponse>(`/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    notifyCatalogChanged();

    return response.tag;
  },

  async remove(id: number): Promise<Tag> {
    const response = await authenticatedRequest<TagResponse>(`/tags/${id}`, {
      method: "DELETE",
    });

    notifyCatalogChanged();

    return response.tag;
  },
};
