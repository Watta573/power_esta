import { apiClient } from "./client";

export interface FormulaAbonnement {
  id: number;
  nom: string;
  description: string;
  prix: number;
  dureeMois: number;
  maxEmpruntsSimultanes: number;
  couleur: string;
  ordre: number;
}

export interface AbonnementActif {
  actif: boolean;
  formule: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  montant: number;
  statut: string;
  maxEmprunts: number;
  joursRestants: number;
}

export interface DemandeEnAttente {
  id: number;
  utilisateur: string;
  email: string;
  formule: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  codeReservation: string;
}

export interface CotisationInfo {
  id: number;
  codeReservation: string;
  utilisateur: string;
  email: string;
  identifiant: string;
  formule: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
}

export interface CotisationListItem {
  id: number;
  codeReservation: string;
  utilisateur: string;
  email: string;
  identifiant: string;
  formule: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  datePaiement: string;
  statut: string;
}

export const abonnementsApi = {
  getFormules: () => apiClient.get<FormulaAbonnement[]>("/abonnements/formules"),
  getMonAbonnement: () => apiClient.get<AbonnementActif>("/abonnements/mon-abonnement"),
  souscrire: (formulaId: number) => apiClient.post("/abonnements/souscrire", { formulaId }),
  renouveler: (formulaId: number) => apiClient.post("/abonnements/renouveler", { formulaId }),
  getEnAttente: () => apiClient.get<DemandeEnAttente[]>("/abonnements/en-attente"),
  notifier: (id: number) => apiClient.post(`/abonnements/notifier/${id}`),
  rechercherParCode: (code: string) => apiClient.get<CotisationInfo>(`/abonnements/rechercher/${code}`),
  valider: (id: number) => apiClient.post(`/abonnements/valider/${id}`),
  rejeter: (id: number) => apiClient.post(`/abonnements/rejeter/${id}`),
  annulerDemande: () => apiClient.post("/abonnements/annuler-demande"),
  getTous: (params?: Record<string, unknown>) =>
    apiClient.get<import("@/types").PageResponse<CotisationListItem>>("/abonnements/tous", { params }),
  getMesAbonnements: (params?: Record<string, unknown>) =>
    apiClient.get<import("@/types").PageResponse<CotisationListItem>>("/abonnements/mes-abonnements", { params }),
  exportPdf: (params?: Record<string, unknown>) =>
    apiClient.get("/abonnements/export/pdf", { params, responseType: "blob" }),
  exportExcel: (params?: Record<string, unknown>) =>
    apiClient.get("/abonnements/export/excel", { params, responseType: "blob" }),
  exportMesPdf: (params?: Record<string, unknown>) =>
    apiClient.get("/abonnements/mes-abonnements/export/pdf", { params, responseType: "blob" }),
  exportMesExcel: (params?: Record<string, unknown>) =>
    apiClient.get("/abonnements/mes-abonnements/export/excel", { params, responseType: "blob" }),
};
