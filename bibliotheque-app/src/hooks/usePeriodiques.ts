import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { periodiquesApi, type NumeroPayload, type PeriodiquePayload } from "@/api/periodiques.api";

export function usePeriodiques(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["periodiques", params],
    queryFn: () => periodiquesApi.getAll(params).then((r) => r.data),
  });
}

export function useNumerosPeriodique(periodiqueId: number | undefined, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["numeros-periodique", periodiqueId, params],
    queryFn: () => periodiquesApi.getNumeros(periodiqueId!, params).then((r) => r.data),
    enabled: !!periodiqueId,
  });
}

export function useCreatePeriodique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: periodiquesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodiques"] });
      toast.success("Périodique créé avec succès");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdatePeriodique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PeriodiquePayload }) =>
      periodiquesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodiques"] });
      toast.success("Périodique mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeletePeriodique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: periodiquesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodiques"] });
      toast.success("Périodique supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

export function useAddNumeroPeriodique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodiqueId, payload }: { periodiqueId: number; payload: NumeroPayload }) =>
      periodiquesApi.addNumero(periodiqueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numeros-periodique"] });
      toast.success("Numéro ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateNumeroPeriodique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ numeroId, payload }: { numeroId: number; payload: NumeroPayload }) =>
      periodiquesApi.updateNumero(numeroId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numeros-periodique"] });
      toast.success("Numéro mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteNumeroPeriodique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: periodiquesApi.deleteNumero,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numeros-periodique"] });
      toast.success("Numéro supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
