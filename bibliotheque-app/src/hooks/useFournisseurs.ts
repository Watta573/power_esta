import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fournisseursApi, type FournisseurPayload } from "@/api/fournisseurs.api";

export function useFournisseurs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["fournisseurs", params],
    queryFn: () => fournisseursApi.getAll(params).then((r) => r.data),
  });
}

export function useFournisseursList() {
  return useQuery({
    queryKey: ["fournisseurs-list"],
    queryFn: () => fournisseursApi.getList().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fournisseursApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
      queryClient.invalidateQueries({ queryKey: ["fournisseurs-list"] });
      toast.success("Fournisseur créé avec succès");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdateFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FournisseurPayload }) =>
      fournisseursApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
      queryClient.invalidateQueries({ queryKey: ["fournisseurs-list"] });
      toast.success("Fournisseur mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fournisseursApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
      queryClient.invalidateQueries({ queryKey: ["fournisseurs-list"] });
      toast.success("Fournisseur supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
