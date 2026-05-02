import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { languesApi } from "@/api/langues.api";

export function useLangues() {
  return useQuery({
    queryKey: ["langues"],
    queryFn: () => languesApi.getAll().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLangue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nom: string) => languesApi.create(nom),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["langues"] }); toast.success("Langue ajoutée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur"),
  });
}

export function useUpdateLangue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nom }: { id: number; nom: string }) => languesApi.update(id, nom),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["langues"] }); toast.success("Langue modifiée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur"),
  });
}

export function useDeleteLangue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => languesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["langues"] }); toast.success("Langue supprimée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Impossible de supprimer"),
  });
}
