import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories.api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

