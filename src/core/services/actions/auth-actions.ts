import { useMutation } from "@tanstack/react-query";
import { authApi } from "../API/auth";

export function useLoginAction() {
  return useMutation({
    mutationFn: (credentials: any) => authApi.login(credentials),
    onSuccess: (data: any) => {
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    },
  });
}
