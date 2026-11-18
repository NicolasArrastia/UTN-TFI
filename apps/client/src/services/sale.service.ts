import { authenticatedRequest } from "./api-client.ts";
import type {
  CancelledSale,
  SaleDetail,
  SaleListParams,
  SalesResponse,
} from "../types/sale.types.ts";

interface SaleDetailResponse {
  sale: SaleDetail;
}

interface CancelSaleResponse {
  sale: CancelledSale;
}

const buildListQuery = (params: SaleListParams): string => {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.sortBy !== undefined && params.sortBy !== "createdAt") {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.sortDir !== undefined && params.sortDir !== "desc") {
    searchParams.set("sortDir", params.sortDir);
  }

  if (params.userId !== undefined) {
    searchParams.set("userId", String(params.userId));
  }

  if (params.from) {
    searchParams.set("from", params.from);
  }

  if (params.to) {
    searchParams.set("to", params.to);
  }

  if (params.status !== undefined) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const saleService = {
  list(params: SaleListParams, signal?: AbortSignal): Promise<SalesResponse> {
    return authenticatedRequest<SalesResponse>(
      `/sales${buildListQuery(params)}`,
      { signal },
    );
  },

  async getById(id: number, signal?: AbortSignal): Promise<SaleDetail> {
    const response = await authenticatedRequest<SaleDetailResponse>(
      `/sales/${id}`,
      { signal },
    );

    return response.sale;
  },

  async cancel(id: number, reason: string): Promise<CancelledSale> {
    const response = await authenticatedRequest<CancelSaleResponse>(
      `/sales/${id}/cancel`,
      {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      },
    );

    return response.sale;
  },
};
