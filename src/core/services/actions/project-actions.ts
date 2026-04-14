import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../API/projects";
import { Project } from "../loaders/project-loaders";

interface CreateProjectPayload {
  ref_id: string;
  name: string;
}

export function useCreateProjectAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectsApi.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

interface UpdateProjectPayload {
  ref_id?: string;
  name?: string;
}

export function useUpdateProjectAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: string; data: UpdateProjectPayload }) => 
      projectsApi.updateProject(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProjectAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
