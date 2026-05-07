import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../API/projects";

export interface Project {
  id: string;
  activity_type_code: string;
  name: string;
  vcdp_component: string | null;
  created_by: string | null;
  created_at: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getProjects,
  });
}
