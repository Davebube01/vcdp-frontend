import { apiRequest } from "./client";

export interface Institution {
  id: string;
  state: string;
  code: string;
  name: string;
  created_at: string;
}

export const institutionApi = {
  list: (state?: string) => {
    const params = state ? `?state=${encodeURIComponent(state)}` : "";
    return apiRequest<Institution[]>(`/api/v1/institutions${params}`);
  },

  create: (data: Partial<Institution>) =>
    apiRequest<Institution>("/api/v1/institutions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Institution>) =>
    apiRequest<Institution>(`/api/v1/institutions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/v1/institutions/${id}`, {
      method: "DELETE",
    }),
};
