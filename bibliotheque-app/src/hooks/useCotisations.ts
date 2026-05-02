import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cotisationsApi } from "@/api/cotisations.api";

export function useCotisations(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ["cotisations", params],
    queryFn: () => cotisationsApi.getAll(params).then((r) => r.data),
    enabled,
  });
}

export function useCotisation(id: number | undefined) {
  return useQuery({
    queryKey: ["cotisation", id],
    queryFn: () => cotisationsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCotisationStats(enabled = true) {
  return useQuery({
    queryKey: ["cotisations-stats"],
    queryFn: () => cotisationsApi.getStats().then((r) => r.data),
    enabled,
  });
}

export function useCotisationActive(utilisateurId: number | undefined) {
  return useQuery({
    queryKey: ["cotisation-active", utilisateurId],
    queryFn: () => cotisationsApi.getCotisationActive(utilisateurId!).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useCreateCotisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cotisationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotisations"] });
      queryClient.invalidateQueries({ queryKey: ["cotisations-stats"] });
      toast.success("Cotisation enregistrée et reçu envoyé par email");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

export function useMyCotisations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["my-cotisations", params],
    queryFn: () => cotisationsApi.getMyCotisations(params).then((r) => r.data),
  });
}

export function useAnnulerCotisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cotisationsApi.annuler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotisations"] });
      queryClient.invalidateQueries({ queryKey: ["cotisations-stats"] });
      toast.success("Cotisation annulée");
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });
}
