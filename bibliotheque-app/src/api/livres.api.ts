import { apiClient } from "./client";
import type { EtatExemplaire, Exemplaire, Livre, PageResponse } from "@/types";

export interface LivreQueryParams {
  page?: number;
  size?: number;
  q?: string;
  categorie?: string;
  categorieId?: number;
  auteur?: string;
  langue?: string;
  anneeMin?: number;
  anneeMax?: number;
  disponibleSeulement?: boolean;
}

export interface ExemplaireCreatePayload {
  codeExemplaire: string;
  etat: EtatExemplaire;
  disponible?: boolean;
  localisation?: string;
}

export const livresApi = {
  getAll: (params: LivreQueryParams) => apiClient.get<PageResponse<Livre>>("/livres", { params }),
  getIndisponibles: (params?: { q?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Livre>>("/livres/indisponibles", { params }),
  getById: (id: number) => apiClient.get<Livre>(`/livres/${id}`),
  getSimilaires: (id: number) => apiClient.get<Livre[]>(`/livres/${id}/similaires`),
  getDisponibilite: (id: number) =>
    apiClient.get<{ total: number; disponibles: number; empruntes: number; prochainRetour: string; tailleFile: number }>(`/livres/${id}/disponibilite`),
  create: (data: FormData) =>
    apiClient.post<Livre>("/admin/livres", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: number, data: FormData) =>
    apiClient.put<Livre>(`/admin/livres/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: number) => apiClient.delete(`/admin/livres/${id}`),
  getExemplaires: (livreId: number) => apiClient.get<Exemplaire[]>(`/livres/${livreId}/exemplaires`),
  suggest: (q: string) => apiClient.get<string[]>(`/livres/suggest?q=${encodeURIComponent(q)}`),
  addExemplaire: (livreId: number, data: ExemplaireCreatePayload) =>
    apiClient.post<Exemplaire>(`/admin/livres/${livreId}/exemplaires`, data),
  updateExemplaire: (livreId: number, exemplaireId: number, etat?: EtatExemplaire, disponible?: boolean) =>
    apiClient.put<Exemplaire>(`/admin/livres/${livreId}/exemplaires/${exemplaireId}`, null, { params: { etat, disponible } }),
};
