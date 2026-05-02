import { apiClient } from "./client";
import type { PageResponse } from "@/types";

export interface Fournisseur {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  contactNom: string;
  notes: string;
  actif: boolean;
  dateCreation: string;
  nbCommandes: number;
}

export interface FournisseurPayload {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  contactNom?: string;
  notes?: string;
}

export const fournisseursApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<Fournisseur>>("/fournisseurs", { params }),
  getList: () =>
    apiClient.get<Fournisseur[]>("/fournisseurs/all"),
  getById: (id: number) =>
    apiClient.get<Fournisseur>(`/fournisseurs/${id}`),
  create: (payload: FournisseurPayload) =>
    apiClient.post<Fournisseur>("/fournisseurs", payload),
  update: (id: number, payload: FournisseurPayload) =>
    apiClient.put<Fournisseur>(`/fournisseurs/${id}`, payload),
  delete: (id: number) =>
    apiClient.delete(`/fournisseurs/${id}`),
};
