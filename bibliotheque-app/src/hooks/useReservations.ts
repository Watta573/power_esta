import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { reservationsApi } from "@/api/reservations.api";

export function useReservations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["reservations", params],
    queryFn: () => reservationsApi.getAll(params).then((r) => r.data),
  });
}

export function useConfirmerReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationsApi.confirmer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Réservation confirmée");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Impossible de confirmer");
    },
  });
}

export function useAnnulerReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationsApi.annuler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Réservation annulée");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Impossible d'annuler");
    },
  });
}

export function useSupprimerReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationsApi.supprimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Réservation supprimée");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Impossible de supprimer");
    },
  });
}

export function useRelancerReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationsApi.relancer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Réservation relancée avec succès");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Impossible de relancer");
    },
  });
}
