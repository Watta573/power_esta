import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquisitionsApi } from "@/api/acquisitions.api";

export function useSuggestions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["suggestions", params],
    queryFn: () => acquisitionsApi.getSuggestions(params).then((r) => r.data),
  });
}

export function useCommandes(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ["commandes", params],
    queryFn: () => acquisitionsApi.getCommandes(params).then((r) => r.data),
    enabled,
  });
}

export function useAcquisitionStats(enabled = true) {
  return useQuery({
    queryKey: ["acquisitions-stats"],
    queryFn: () => acquisitionsApi.getStats().then((r) => r.data),
    enabled,
  });
}

export function useCreerSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acquisitionsApi.creerSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["acquisitions-stats"] });
      toast.success("Suggestion soumise avec succès");
    },
    onError: () => toast.error("Erreur lors de la soumission"),
  });
}

export function useChangerStatutSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: string }) =>
      acquisitionsApi.changerStatutSuggestion(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["acquisitions-stats"] });
      toast.success("Statut mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useCreerCommande() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acquisitionsApi.creerCommande,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      queryClient.invalidateQueries({ queryKey: ["acquisitions-stats"] });
      toast.success("Commande créée avec succès");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useMarquerLivree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acquisitionsApi.marquerLivree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      queryClient.invalidateQueries({ queryKey: ["acquisitions-stats"] });
      toast.success("Commande marquée comme livrée");
    },
  });
}

export function useAnnulerCommande() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acquisitionsApi.annulerCommande,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      toast.success("Commande annulée");
    },
  });
}
