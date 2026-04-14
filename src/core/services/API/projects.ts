import { apiRequest } from "./client";
import { Project } from "../loaders/project-loaders";

export const projectsApi = {
  getProjects: () => apiRequest<Project[]>("/api/v1/projects", { method: "GET" }),
  createProject: (data: { ref_id: string; name: string }) =>
    apiRequest<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: { ref_id?: string; name?: string }) =>
    apiRequest<Project>(`/api/v1/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    apiRequest<void>(`/api/v1/projects/${id}`, {
      method: "DELETE",
    }),
};
