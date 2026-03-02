import { apiRequest } from "./client";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: any;
}

export const authApi = {
  login: (credentials: any) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};
