import { apiRequest } from "./client";
import { Project } from "../loaders/project-loaders";

export const projectsApi = {
  getProjects: () => apiRequest<Project[]>("/api/v1/projects", { method: "GET" }),
  createProject: (data: { activity_type_code: string; name: string; vcdp_component?: string }) =>
    apiRequest<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: { activity_type_code?: string; name?: string; vcdp_component?: string }) =>
    apiRequest<Project>(`/api/v1/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    apiRequest<void>(`/api/v1/projects/${id}`, {
      method: "DELETE",
    }),
};
