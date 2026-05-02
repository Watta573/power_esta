import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions.api';
import type { Permission } from '@/api/permissions.api';

// Hook pour obtenir toutes les permissions
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.getAll().then(r => r.data),
  });
}

// Hook pour obtenir les permissions d'un utilisateur
export function useUserPermissions(utilisateurId: number | undefined) {
  return useQuery({
    queryKey: ['user-permissions', utilisateurId],
    queryFn: () => utilisateurId ? permissionsApi.getUserPermissions(utilisateurId).then(r => r.data) : [],
    enabled: !!utilisateurId,
  });
}

// Hook pour accorder une permission
export function useAccorderPermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ utilisateurId, request }: { utilisateurId: number; request: { permissionCode: string; notes?: string } }) =>
      permissionsApi.accorderPermission(utilisateurId, request),
    onSuccess: (_, { utilisateurId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', utilisateurId] });
    },
  });
}

// Hook pour révoquer une permission
export function useRevoquerPermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ utilisateurId, request }: { utilisateurId: number; request: { permissionCode: string; notes?: string } }) =>
      permissionsApi.revoquerPermission(utilisateurId, request),
    onSuccess: (_, { utilisateurId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', utilisateurId] });
    },
  });
}