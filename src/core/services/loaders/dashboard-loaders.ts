import { useQuery } from "@tanstack/react-query";
import { dashboardApi, DashboardMetrics } from "../API/dashboard";

export function useDashboardMetrics(params: URLSearchParams) {
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard", "metrics", params.toString()],
    queryFn: () => dashboardApi.getMetrics(params),
  });
}
