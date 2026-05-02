import { useQuery } from "@tanstack/react-query";
import { statistiquesApi } from "@/api/statistiques.api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => statistiquesApi.getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  });
}
