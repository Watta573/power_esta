import { apiClient } from "./client";

export interface LangueDto {
  id: number;
  nom: string;
}

export const languesApi = {
  getAll: () => apiClient.get<LangueDto[]>("/langues"),
  create: (nom: string) => apiClient.post<LangueDto>("/langues", { nom }),
  update: (id: number, nom: string) => apiClient.put<LangueDto>(`/langues/${id}`, { nom }),
  delete: (id: number) => apiClient.delete(`/langues/${id}`),
};
