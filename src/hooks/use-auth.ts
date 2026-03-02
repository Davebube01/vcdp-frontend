import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  state: string | null;
  is_active: boolean;
}

export function useUser() {
  return useQuery<User | null>({
    queryKey: ["/api/users/me"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
