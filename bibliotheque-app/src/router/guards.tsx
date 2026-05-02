import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import type { Role } from "@/types";

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN:          5,
  BIBLIOTHECAIRE: 4,
  ENSEIGNANT:     3,
  ETUDIANT:       2,
  PUBLIC:         1,
};

function hasMinRole(userRole: Role | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

function logUnauthorizedAccess(path: string, userRole: Role | undefined, requiredRoles: Role[]) {
  const safePath = path.replace(/[\r\n\t]/g, " ").substring(0, 100);
  const safeRole = String(userRole ?? "inconnu").replace(/[\r\n\t]/g, " ");
  const safeRequired = requiredRoles.join(", ").replace(/[\r\n\t]/g, " ");
  console.warn(`[Security] Accès non autorisé — Chemin: ${safePath} | Rôle: ${safeRole} | Requis: ${safeRequired}`);
}

export function ProtectedRoute({ children, roles, minRole }: {
  children: ReactNode;
  roles?: Role[];
  minRole?: Role;
}) {
  const { isAuthenticated, utilisateur } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/accueil" state={{ from: location.pathname }} replace />;
  }

  const userRole = utilisateur?.role;

  if (roles && userRole && !roles.includes(userRole)) {
    logUnauthorizedAccess(location.pathname, userRole, roles);
    return <Navigate to="/dashboard" replace />;
  }

  if (minRole && !hasMinRole(userRole, minRole)) {
    logUnauthorizedAccess(location.pathname, userRole, [minRole]);
    return <Navigate to="/dashboard" replace />;
  }

  if (utilisateur && !utilisateur.actif) {
    useAuthStore.getState().logout();
    return <Navigate to="/accueil" state={{ reason: "account_disabled" }} replace />;
  }

  return <>{children}</>;
}

export function AdminOnly({ children }: { children: ReactNode }) {
  return <ProtectedRoute roles={["ADMIN"]}>{children}</ProtectedRoute>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute roles={["ADMIN", "BIBLIOTHECAIRE"]}>{children}</ProtectedRoute>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
