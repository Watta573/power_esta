import { apiClient } from "./client";
import type { Notification, PageResponse } from "@/types";

export const notificationsApi = {
  getAll: (utilisateurId: number, page = 0, size = 20) =>
    apiClient.get<PageResponse<Notification>>("/notifications", { params: { utilisateurId, page, size } }),
  count: (utilisateurId: number) =>
    apiClient.get<{ count: number }>("/notifications/count", { params: { utilisateurId } }),
  lire: (id: number) => apiClient.put(`/notifications/${id}/lire`),
  lireTout: (utilisateurId: number) =>
    apiClient.put("/notifications/lire-tout", null, { params: { utilisateurId } }),
  envoyerGroupee: (payload: {
    roles?: string[];
    sujet?: string;
    message: string;
    type: string;
    dateEnvoiProgramme?: string;
    expediteurId?: number;
  }) => apiClient.post<{ status: string; planifie: boolean }>("/notifications/envoyer-groupee", payload),

  historiqueDiffusions: (page = 0, size = 20) =>
    apiClient.get<PageResponse<DiffusionGroupee>>("/notifications/historique-diffusions", { params: { page, size } }),
};

export interface DiffusionGroupee {
  id: number;
  sujet: string;
  message: string;
  type: string;
  rolesCibles: string;
  nbDestinataires: number;
  dateEnvoi: string;
  dateEnvoiProgramme?: string;
  statut: "ENVOYE" | "PLANIFIE";
  expediteur?: { id: number; prenom: string; nom: string };
}
