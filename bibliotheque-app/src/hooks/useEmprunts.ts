import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { empruntsApi } from "@/api/emprunts.api";

export function useEmprunts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["emprunts", params],
    queryFn: () => empruntsApi.getAll(params).then((r) => r.data),
  });
}

export function useCreerEmprunt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: empruntsApi.creer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emprunts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Emprunt enregistré avec succès");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Erreur lors de l'emprunt");
    },
  });
}

export function useRetourEmprunt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: empruntsApi.retour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emprunts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Retour enregistré");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Erreur lors du retour");
    },
  });
}

export function useRenouvelerEmprunt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: empruntsApi.renouveler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emprunts"] });
      toast.success("Emprunt prolongé et confirmation envoyée par email");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Impossible de renouveler");
    },
  });
}

export function usePayerAmende() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: empruntsApi.payerAmende,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emprunts"] });
      queryClient.invalidateQueries({ queryKey: ["amendes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Amende encaissée — l'utilisateur a été notifié");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message ?? "Erreur lors de l'encaissement");
    },
  });
}

export function useAmendes(params?: { payee?: boolean; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["amendes", params],
    queryFn: () => empruntsApi.getAmendes(params).then((r) => r.data),
  });
}
