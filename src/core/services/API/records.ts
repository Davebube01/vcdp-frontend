import { apiRequest } from "./client";
import { Transaction } from "@/lib/store";

export interface RecordsListResponse {
  items: Transaction[];
  total: number;
  pages: number;
}

export const recordsApi = {
  list: (params: URLSearchParams) =>
    apiRequest<RecordsListResponse>(`/api/records/?${params.toString()}`),

  get: (id: string) => apiRequest<Transaction>(`/api/records/${id}`),

  create: (data: any) =>
    apiRequest<Transaction>("/api/records/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<Transaction>(`/api/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/records/${id}`, {
      method: "DELETE",
    }),

  exportExcel: (params: URLSearchParams) => {
    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const queryString = params.toString();
    const prefix = queryString ? `${queryString}&` : "";
    return `${baseUrl}/api/records/export/excel?${prefix}token=${token}`;
  },
};
