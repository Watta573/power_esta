import { apiClient } from "./client";
import type { PageResponse, Utilisateur } from "@/types";

export const utilisateursApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<Utilisateur>>("/utilisateurs", { params }),

  getById: (id: number) =>
    apiClient.get<Utilisateur>(`/utilisateurs/${id}`),

  getMe: () =>
    apiClient.get<Utilisateur>("/utilisateurs/me"),

  updateMe: (payload: { nom: string; prenom: string; telephone: string }) =>
    apiClient.put<Utilisateur>("/utilisateurs/me", payload),

  getPrefsNotif: () =>
    apiClient.get<Record<string, boolean>>("/utilisateurs/me/notifications"),

  updatePrefsNotif: (data: Record<string, boolean>) =>
    apiClient.put<Record<string, boolean>>("/utilisateurs/me/notifications", data),

  activer: (id: number, actif: boolean) =>
    apiClient.put<Utilisateur>(`/utilisateurs/${id}/activer`, null, { params: { actif } }),

  modifierRole: (id: number, role: string) =>
    apiClient.put<Utilisateur>(`/utilisateurs/${id}/role`, null, { params: { role } }),

  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<Utilisateur>("/utilisateurs/me/photo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
