import { apiClient } from "./client";
import type { PageResponse } from "@/types";

export interface AbonnementPeriodique {
  id: number;
  periodiqueId: number;
  titrePeriodique: string;
  fournisseurId: number;
  nomFournisseur: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  statut: "ACTIF" | "EXPIRE" | "ANNULE";
  notes?: string;
}

export interface EmpruntPeriodique {
  id: number;
  numeroId: number;
  titrePeriodique: string;
  volume?: string;
  numero: string;
  utilisateurId: number;
  nomUtilisateur: string;
  emailUtilisateur: string;
  role: string;
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourEffective?: string;
  statut: "EN_COURS" | "RETOURNE" | "EN_RETARD";
  amende: number;
  amendePayee: boolean;
  joursRetard: number;
}

export interface ReservationPeriodique {
  id: number;
  numeroId: number;
  titrePeriodique: string;
  volume?: string;
  numero: string;
  utilisateurId: number;
  nomUtilisateur: string;
  emailUtilisateur: string;
  dateReservation: string;
  dateExpiration: string;
  statut: "EN_ATTENTE" | "DISPONIBLE" | "CONFIRMEE" | "ANNULEE";
}

const BASE = "/periodiques-ext";

export const periodiqueExtApi = {
  // Abonnements
  getAbonnements: (params?: { statut?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<AbonnementPeriodique>>(`${BASE}/abonnements`, { params }),
  creerAbonnement: (data: { periodiqueId: number; fournisseurId: number; dateDebut: string; dateFin: string; montant: number; notes?: string }) =>
    apiClient.post<AbonnementPeriodique>(`${BASE}/abonnements`, data),
  annulerAbonnement: (id: number) =>
    apiClient.put<AbonnementPeriodique>(`${BASE}/abonnements/${id}/annuler`),

  // Emprunts
  getEmprunts: (params?: { utilisateurId?: number; statut?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<EmpruntPeriodique>>(`${BASE}/emprunts`, { params }),
  creerEmprunt: (data: { numeroId: number; utilisateurId: number }) =>
    apiClient.post<EmpruntPeriodique>(`${BASE}/emprunts`, data),
  retour: (id: number) =>
    apiClient.put<EmpruntPeriodique>(`${BASE}/emprunts/${id}/retour`),
  payerAmende: (id: number) =>
    apiClient.put<EmpruntPeriodique>(`${BASE}/emprunts/${id}/payer-amende`),

  // Réservations
  getReservations: (params?: { utilisateurId?: number; statut?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<ReservationPeriodique>>(`${BASE}/reservations`, { params }),
  creerReservation: (data: { numeroId: number; utilisateurId: number }) =>
    apiClient.post<ReservationPeriodique>(`${BASE}/reservations`, data),
  annulerReservation: (id: number) =>
    apiClient.put<ReservationPeriodique>(`${BASE}/reservations/${id}/annuler`),
  confirmerReservation: (id: number) =>
    apiClient.put<ReservationPeriodique>(`${BASE}/reservations/${id}/confirmer`),
};
