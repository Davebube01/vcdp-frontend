import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, usersApi } from "../API/users";

export function useMe() {
  return useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users", "list"],
    queryFn: usersApi.list,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });
}
