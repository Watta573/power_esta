import { useQuery } from "@tanstack/react-query";
import { utilisateursApi } from "@/api/utilisateurs.api";

export function useUtilisateurs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["utilisateurs", params],
    queryFn: () => utilisateursApi.getAll(params).then((r) => r.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
