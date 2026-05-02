import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const { isAuthenticated, utilisateur, hasRole, logout, setAuth } = useAuthStore();
  return { isAuthenticated, utilisateur, hasRole, logout, setAuth };
}
