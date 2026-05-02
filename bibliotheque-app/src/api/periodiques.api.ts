import { apiClient } from "./client";
import type { PageResponse } from "@/types";

export interface Periodique {
  id: number;
  titre: string;
  issn: string;
  editeur: string;
  langue: string;
  frequence: string;
  description: string;
  couverture: string;
  actif: boolean;
  dateAjout: string;
}

export interface NumeroPeriodique {
  id: number;
  periodiqueId: number;
  titrePeriodique: string;
  volume: string;
  numero: string;
  dateParution: string;
  disponible: boolean;
  localisation: string;
  notes: string;
}

export interface PeriodiquePayload {
  titre: string;
  issn?: string;
  editeur?: string;
  langue?: string;
  frequence?: string;
  description?: string;
  couverture?: string;
}

export interface NumeroPayload {
  periodiqueId: number;
  volume?: string;
  numero: string;
  dateParution: string;
  disponible: boolean;
  localisation?: string;
  notes?: string;
}

export const periodiquesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<Periodique>>("/periodiques", { params }),
  getById: (id: number) =>
    apiClient.get<Periodique>(`/periodiques/${id}`),
  create: (payload: PeriodiquePayload) =>
    apiClient.post<Periodique>("/periodiques", payload),
  update: (id: number, payload: PeriodiquePayload) =>
    apiClient.put<Periodique>(`/periodiques/${id}`, payload),
  delete: (id: number) =>
    apiClient.delete(`/periodiques/${id}`),
  getNumeros: (periodiqueId: number, params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<NumeroPeriodique>>(`/periodiques/${periodiqueId}/numeros`, { params }),
  addNumero: (periodiqueId: number, payload: NumeroPayload) =>
    apiClient.post<NumeroPeriodique>(`/periodiques/${periodiqueId}/numeros`, payload),
  updateNumero: (numeroId: number, payload: NumeroPayload) =>
    apiClient.put<NumeroPeriodique>(`/periodiques/numeros/${numeroId}`, payload),
  deleteNumero: (numeroId: number) =>
    apiClient.delete(`/periodiques/numeros/${numeroId}`),
};
