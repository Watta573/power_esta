import { useQuery } from "@tanstack/react-query";
import { livresApi, type LivreQueryParams } from "@/api/livres.api";

export function useLivres(params: LivreQueryParams) {
  return useQuery({
    queryKey: ["livres", params],
    queryFn: () => livresApi.getAll(params).then((r) => r.data),
  });
}
