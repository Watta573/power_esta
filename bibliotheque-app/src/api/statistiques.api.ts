import { apiClient } from "./client";
import type { DashboardStats } from "@/types";

export const statistiquesApi = {
  getDashboard: (dateDebut?: string, dateFin?: string) =>
    apiClient.get<DashboardStats>("/statistiques/dashboard", {
      params: { dateDebut, dateFin },
    }),
  getRetards: (params?: Record<string, unknown>) => apiClient.get("/emprunts", { params: { statut: "EN_RETARD", size: 100, ...params } }),
};
