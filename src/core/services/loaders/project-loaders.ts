import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../API/projects";

export interface Project {
  id: string;
  ref_id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getProjects,
  });
}
