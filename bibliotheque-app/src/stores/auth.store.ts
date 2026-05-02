import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, Utilisateur } from "@/types";
import { permissionsApi } from "@/api/permissions.api";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  utilisateur: Utilisateur | null;
  permissions: string[];
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, utilisateur: Utilisateur) => void;
  updateUtilisateur: (utilisateur: Utilisateur) => void;
  loadPermissions: () => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permissionCode: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      utilisateur: null,
      permissions: [],
      isAuthenticated: false,
      setAuth: (token, refreshToken, utilisateur) => {
        set({ token, refreshToken, utilisateur, isAuthenticated: true });
        // Charger les permissions après l'authentification
        setTimeout(() => {
          get().loadPermissions();
        }, 100);
      },
      updateUtilisateur: (utilisateur) => set({ utilisateur }),
      loadPermissions: async () => {
        const { utilisateur } = get();
        if (utilisateur?.id) {
          try {
            const response = await permissionsApi.getUserPermissions(utilisateur.id);
            set({ permissions: response.data });
          } catch (error) {
            console.error('Erreur lors du chargement des permissions:', error);
            set({ permissions: [] });
          }
        }
      },
      logout: () => set({ token: null, refreshToken: null, utilisateur: null, permissions: [], isAuthenticated: false }),
      hasRole: (roles) => {
        const role = get().utilisateur?.role;
        return role ? roles.includes(role) : false;
      },
      hasPermission: (permissionCode) => {
        const { permissions } = get();
        return permissions.includes(permissionCode);
      },
    }),
    { name: "auth-storage" },
  ),
);
