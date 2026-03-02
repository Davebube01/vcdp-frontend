import { apiRequest } from "./client";

export interface DashboardMetrics {
  kpis: {
    total_expenditure: number;
    total_transactions: number;
    climate_flagged_pct: number;
    active_states: number;
  };
  charts: {
    threefs: { name: string; value: number }[];
    trend: { year: number; expenditure: number }[];
    state_performance: { name: string; value: number }[];
    funding_sources: { name: string; value: number }[];
  };
}

export const dashboardApi = {
  getMetrics: (params: URLSearchParams) =>
    apiRequest<DashboardMetrics>(
      `/api/records/dashboard/metrics?${params.toString()}`,
    ),
};
