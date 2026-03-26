import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../API/client";

export interface Document {
  id: string;
  name: string;
  filename: string;
  file_path: string;
  state: string;
  data_source: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export function useDocuments(state?: string, dataSource?: string) {
  return useQuery<Document[]>({
    queryKey: ["documents", state, dataSource],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state) params.append("state", state);
      if (dataSource) params.append("data_source", dataSource);
      
      return apiRequest<Document[]>(`/api/documents/?${params.toString()}`);
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest<Document>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
      return apiRequest<Document>(`/api/documents/${id}`, {
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<void>(`/api/documents/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
