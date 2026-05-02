import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications.api";

export function useNotifications(utilisateurId: number | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: ["notifications", utilisateurId, page, size],
    queryFn: () => notificationsApi.getAll(utilisateurId!, page, size).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useNotificationsCount(utilisateurId: number | undefined) {
  return useQuery({
    queryKey: ["notifications-count", utilisateurId],
    queryFn: () => notificationsApi.count(utilisateurId!).then((r) => r.data.count),
    enabled: !!utilisateurId,
    refetchInterval: 30000,
  });
}

export function useLireNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.lire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });
}

export function useLireToutesNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.lireTout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });
}
