import { apiClient } from "./client";
import type { Emprunt, PageResponse } from "@/types";

export const empruntsApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<PageResponse<Emprunt>>("/emprunts", { params }),
  creer: (payload: { utilisateurId: number; exemplaireId: number; livreId?: number }) => apiClient.post<Emprunt>("/emprunts", payload),
  retour: (id: number) => apiClient.put<Emprunt>(`/emprunts/${id}/retour`),
  renouveler: (id: number) => apiClient.put<Emprunt>(`/emprunts/${id}/renouveler`),
  payerAmende: (id: number) => apiClient.put<Emprunt>(`/emprunts/${id}/payer-amende`),
  getByLivre: (livreId: number, params?: { page?: number; size?: number }) =>
    apiClient.get<PageResponse<Emprunt>>("/emprunts", { params: { ...params, livreId } }),
};
