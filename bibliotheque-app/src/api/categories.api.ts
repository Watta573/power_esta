import { apiClient } from "./client";
import type { Categorie } from "@/types";

export interface CategorieRequest {
  nom: string;
  description?: string;
  couleur?: string;
}

export const categoriesApi = {
  getAll: () => apiClient.get<Categorie[]>("/categories"),
  create: (data: CategorieRequest) => apiClient.post<Categorie>("/categories", data),
  update: (id: number, data: CategorieRequest) => apiClient.put<Categorie>(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`),
};

