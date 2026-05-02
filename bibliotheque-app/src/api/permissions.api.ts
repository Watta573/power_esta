import { apiClient } from './client';

export interface Permission {
  id: number;
  code: string;
  nom: string;
  description?: string;
  module: string;
  actif: boolean;
}

export interface AccorderPermissionRequest {
  permissionCode: string;
  notes?: string;
}

export interface RevoquerPermissionRequest {
  permissionCode: string;
  notes?: string;
}

export const permissionsApi = {
  // Obtenir toutes les permissions
  getAll: () => apiClient.get<Permission[]>('/permissions'),
  
  // Obtenir les permissions d'un utilisateur
  getUserPermissions: (utilisateurId: number) => 
    apiClient.get<string[]>(`/permissions/utilisateur/${utilisateurId}`),
  
  // Vérifier si un utilisateur a une permission
  hasPermission: (utilisateurId: number, permissionCode: string) =>
    apiClient.get<{ hasPermission: boolean }>(`/permissions/utilisateur/${utilisateurId}/has/${permissionCode}`),
  
  // Accorder une permission
  accorderPermission: (utilisateurId: number, request: AccorderPermissionRequest) =>
    apiClient.post<{ message: string }>(`/permissions/utilisateur/${utilisateurId}/accorder`, request),
  
  // Révoquer une permission
  revoquerPermission: (utilisateurId: number, request: RevoquerPermissionRequest) =>
    apiClient.post<{ message: string }>(`/permissions/utilisateur/${utilisateurId}/revoquer`, request),
};