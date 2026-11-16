import { authenticatedRequest } from "./api-client.ts";
import type {
  OverviewStats,
  StatsPeriod,
  StatsResponse,
} from "../types/stats.types.ts";

export const statsService = {
  async getOverview(options: RequestInit = {}): Promise<OverviewStats> {
    const response = await authenticatedRequest<{ overview: OverviewStats }>(
      "/stats/overview",
      options,
    );

    return response.overview;
  },

  async getStats(
    period: StatsPeriod,
    options: RequestInit = {},
  ): Promise<StatsResponse> {
    const response = await authenticatedRequest<{ stats: StatsResponse }>(
      `/stats?period=${period}`,
      options,
    );

    return response.stats;
  },
};
