import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../API/users";

export function useCreateUserAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });
}
  