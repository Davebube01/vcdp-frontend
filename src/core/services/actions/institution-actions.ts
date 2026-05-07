import { useMutation, useQueryClient } from "@tanstack/react-query";
import { institutionApi, Institution } from "../API/institutions";
import { useToast } from "@/hooks/use-toast";

export const institutionActions = {
  create: async (data: Omit<Institution, "id" | "created_at">) => {
    return institutionApi.create(data);
  },
  update: async ({ id, ...data }: Partial<Institution> & { id: string }) => {
    return institutionApi.update(id, data);
  },
  delete: async (id: string) => {
    return institutionApi.delete(id);
  },
};

export function useCreateInstitutionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: institutionActions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Success",
        description: "Institution created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create institution",
      });
    },
  });
}

export function useUpdateInstitutionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: institutionActions.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Success",
        description: "Institution updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update institution",
      });
    },
  });
}

export function useDeleteInstitutionAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: institutionActions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Success",
        description: "Institution deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete institution",
      });
    },
  });
}
