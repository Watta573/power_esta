import { apiClient } from "./client";
import type { PageResponse, Utilisateur } from "@/types";

export interface AuditLog {
  id: number;
  email: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
  dateAction: string;
  statut: "SUCCESS" | "FAILURE";
}

export const adminApi = {
  getAudit: (params?: Record<string, unknown>) =>
    apiClient.get<PageResponse<AuditLog>>("/admin/audit", { params }),
  changerRole: (id: number, role: string) =>
    apiClient.put<Utilisateur>(`/admin/utilisateurs/${id}/role`, null, { params: { role } }),
  activer: (id: number, actif: boolean) =>
    apiClient.put<Utilisateur>(`/admin/utilisateurs/${id}/activer`, null, { params: { actif } }),
};
