import { apiRequest } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "national_admin" | "state_coordinator";
  state: string | null;
  is_active: boolean;
}

export const usersApi = {
  getMe: () => apiRequest<User>("/api/users/me"),
  list: () => apiRequest<User[]>("/api/users/"),
  create: (data: any) =>
    apiRequest<User>("/api/users/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
