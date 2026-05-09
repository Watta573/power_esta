import { apiClient } from "./client";
import type { PageResponse, Reservation } from "@/types";

export const reservationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<Reservation>>("/reservations", { params }),
  verifierExpiration: () => apiClient.post<void>("/reservations/verifier-expiration"),
  creer: (payload: { utilisateurId: number; livreId: number }) => apiClient.post<Reservation>("/reservations", payload),
  confirmer: (id: number) => apiClient.put<Reservation>(`/reservations/${id}/confirmer`),
  annuler: (id: number) => apiClient.put<void>(`/reservations/${id}/annuler`),
  relancer: (id: number) => apiClient.post<Reservation>(`/reservations/${id}/relancer`),
  supprimer: (id: number) => apiClient.delete<void>(`/reservations/${id}`),
};
