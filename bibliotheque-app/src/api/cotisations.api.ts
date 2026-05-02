import { apiClient } from "./client";
import type { PageResponse } from "@/types";

export interface Cotisation {
  id: number;
  utilisateurId: number;
  utilisateurNom: string;
  utilisateurEmail: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  statut: "ACTIVE" | "EXPIREE" | "ANNULEE";
  notes: string;
  datePaiement: string;
}

export interface CotisationStats {
  totalActives: number;
  totalExpirees: number;
  montantTotal: number;
}

export interface CotisationPayload {
  utilisateurId: number;
  montant: number;
  dateDebut: string;
  dateFin: string;
  notes?: string;
}

export const cotisationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<Cotisation>>("/cotisations", { params }),
  getById: (id: number) =>
    apiClient.get<Cotisation>(`/cotisations/${id}`),
  getMyCotisations: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<Cotisation>>("/cotisations/me", { params }),
  create: (payload: CotisationPayload) =>
    apiClient.post<Cotisation>("/cotisations", payload),
  annuler: (id: number) =>
    apiClient.put<Cotisation>(`/cotisations/${id}/annuler`),
  getStats: () =>
    apiClient.get<CotisationStats>("/cotisations/stats"),
  getCotisationActive: (utilisateurId: number) =>
    apiClient.get<{ active: boolean; dateFin?: string; montant?: number }>(
      `/cotisations/utilisateur/${utilisateurId}/active`
    ),
};
