import { apiClient } from "./client";
import type { PageResponse } from "@/types";

export interface SuggestionAchat {
  id: number;
  titre: string;
  auteur: string;
  isbn: string;
  demandeur: string;
  justification: string;
  statut: "EN_ATTENTE" | "APPROUVE" | "REJETE";
  dateDemande: string;
}

export interface CommandeAchat {
  id: number;
  fournisseur: string;
  nbTitres: number;
  montant: number;
  dateCommande: string;
  dateLivraison: string | null;
  statut: "EN_COURS" | "LIVREE" | "ANNULEE";
  notes: string;
}

export interface AcquisitionStats {
  totalSuggestions: number;
  enAttente: number;
  approuvees: number;
  totalCommandes: number;
  montantLivrees: number;
  montantEnCours: number;
}

export const acquisitionsApi = {
  getSuggestions: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<SuggestionAchat>>("/acquisitions/suggestions", { params }),

  creerSuggestion: (payload: { titre: string; auteur?: string; isbn?: string; justification?: string }) =>
    apiClient.post<SuggestionAchat>("/acquisitions/suggestions", payload),

  changerStatutSuggestion: (id: number, statut: string) =>
    apiClient.put<SuggestionAchat>(`/acquisitions/suggestions/${id}/statut`, null, { params: { statut } }),

  getCommandes: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<CommandeAchat>>("/acquisitions/commandes", { params }),

  creerCommande: (payload: { fournisseur: string; nbTitres: number; montant: number; notes?: string }) =>
    apiClient.post<CommandeAchat>("/acquisitions/commandes", payload),

  marquerLivree: (id: number) =>
    apiClient.put<CommandeAchat>(`/acquisitions/commandes/${id}/livrer`),

  annulerCommande: (id: number) =>
    apiClient.put<CommandeAchat>(`/acquisitions/commandes/${id}/annuler`),

  getStats: () =>
    apiClient.get<AcquisitionStats>("/acquisitions/stats"),
};
