import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordsApi } from "../API/records";


export function useCreateRecordAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => recordsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
  });
}

export function useUpdateRecordAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => recordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", "list"] });
      queryClient.invalidateQueries({ queryKey: ["records", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
  });
}

export function useDeleteRecordAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
  });
}

export function useUpdateRecordStatusAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason?: string;
    }) => recordsApi.updateStatus(id, status, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["records", "list"] });
      queryClient.invalidateQueries({ queryKey: ["records", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
  });
}
