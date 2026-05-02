package com.biblioteca.security;

import java.util.HashMap;
import java.util.Map;

/**
 * Mapping des permissions pour tous les endpoints de l'application
 * Système de sécurité granulaire et robuste
 */
public class PermissionMapping {
    
    // Mapping endpoint -> permission requise
    public static final Map<String, String> ENDPOINT_PERMISSIONS = createPermissionMap();
    
    private static Map<String, String> createPermissionMap() {
        Map<String, String> map = new HashMap<>();
        
        // ===== ADMINISTRATION =====
        map.put("GET:/api/utilisateurs", "ADMIN_USERS_VIEW");
        map.put("POST:/api/utilisateurs", "ADMIN_USERS_CREATE");
        map.put("PUT:/api/utilisateurs/{id}", "ADMIN_USERS_EDIT");
        map.put("DELETE:/api/utilisateurs/{id}", "ADMIN_USERS_DELETE");
        map.put("PUT:/api/utilisateurs/{id}/activer", "ADMIN_USERS_ACTIVATE");
        map.put("PUT:/api/utilisateurs/{id}/role", "ADMIN_ROLES_MANAGE");
        map.put("GET:/api/admin/audit", "ADMIN_AUDIT_VIEW");
        
        // ===== LIVRES =====
        map.put("GET:/api/livres", "LIVRES_VIEW");
        map.put("POST:/api/livres", "LIVRES_CREATE");
        map.put("PUT:/api/livres/{id}", "LIVRES_EDIT");
        map.put("DELETE:/api/livres/{id}", "LIVRES_DELETE");
        map.put("POST:/api/livres/import", "LIVRES_IMPORT");
        map.put("GET:/api/livres/export", "LIVRES_EXPORT");
        
        // ===== EXEMPLAIRES =====
        map.put("GET:/api/exemplaires", "EXEMPLAIRES_VIEW");
        map.put("POST:/api/exemplaires", "EXEMPLAIRES_CREATE");
        map.put("PUT:/api/exemplaires/{id}", "EXEMPLAIRES_EDIT");
        map.put("DELETE:/api/exemplaires/{id}", "EXEMPLAIRES_DELETE");
        map.put("PUT:/api/exemplaires/{id}/statut", "EXEMPLAIRES_STATUS");
        
        // ===== EMPRUNTS =====
        map.put("GET:/api/emprunts", "EMPRUNTS_VIEW");
        map.put("POST:/api/emprunts", "EMPRUNTS_CREATE");
        map.put("PUT:/api/emprunts/{id}/retourner", "EMPRUNTS_RETURN");
        map.put("PUT:/api/emprunts/{id}/prolonger", "EMPRUNTS_EXTEND");
        map.put("PUT:/api/emprunts/{id}/annuler", "EMPRUNTS_CANCEL");
        map.put("GET:/api/emprunts/historique", "EMPRUNTS_HISTORY");
        map.put("GET:/api/emprunts/export", "EMPRUNTS_EXPORT");
        
        // ===== RÉSERVATIONS =====
        map.put("GET:/api/reservations", "RESERVATIONS_VIEW");
        map.put("POST:/api/reservations", "RESERVATIONS_CREATE");
        map.put("PUT:/api/reservations/{id}/annuler", "RESERVATIONS_CANCEL");
        map.put("PUT:/api/reservations/{id}/traiter", "RESERVATIONS_PROCESS");
        map.put("GET:/api/reservations/export", "RESERVATIONS_EXPORT");
        
        // ===== FINANCES =====
        map.put("GET:/api/finances", "FINANCES_VIEW");
        map.put("GET:/api/finances/amendes", "FINANCES_AMENDES_VIEW");
        map.put("POST:/api/finances/amendes/{id}/payer", "FINANCES_AMENDES_COLLECT");
        map.put("GET:/api/cotisations", "FINANCES_COTISATIONS_VIEW");
        map.put("POST:/api/cotisations", "FINANCES_COTISATIONS_CREATE");
        map.put("PUT:/api/cotisations/{id}", "FINANCES_COTISATIONS_EDIT");
        map.put("PUT:/api/cotisations/{id}/annuler", "FINANCES_COTISATIONS_CANCEL");
        map.put("GET:/api/finances/rapports", "FINANCES_REPORTS");
        map.put("GET:/api/finances/export", "FINANCES_EXPORT");
        
        // ===== ACQUISITIONS =====
        map.put("GET:/api/acquisitions/suggestions", "ACQUISITIONS_VIEW");
        map.put("POST:/api/acquisitions/suggestions", "ACQUISITIONS_SUGGEST");
        map.put("PUT:/api/acquisitions/suggestions/{id}/approuver", "ACQUISITIONS_APPROVE");
        map.put("PUT:/api/acquisitions/suggestions/{id}/rejeter", "ACQUISITIONS_REJECT");
        map.put("GET:/api/acquisitions/commandes", "ACQUISITIONS_ORDERS_VIEW");
        map.put("POST:/api/acquisitions/commandes", "ACQUISITIONS_ORDERS_CREATE");
        map.put("PUT:/api/acquisitions/commandes/{id}", "ACQUISITIONS_ORDERS_EDIT");
        map.put("PUT:/api/acquisitions/commandes/{id}/annuler", "ACQUISITIONS_ORDERS_CANCEL");
        map.put("PUT:/api/acquisitions/commandes/{id}/livrer", "ACQUISITIONS_DELIVERY");
        map.put("GET:/api/acquisitions/budget", "ACQUISITIONS_BUDGET");
        map.put("GET:/api/acquisitions/export", "ACQUISITIONS_EXPORT");
        
        // ===== AUTRES MODULES =====
        map.put("GET:/api/fournisseurs", "FOURNISSEURS_VIEW");
        map.put("POST:/api/fournisseurs", "FOURNISSEURS_CREATE");
        map.put("PUT:/api/fournisseurs/{id}", "FOURNISSEURS_EDIT");
        map.put("DELETE:/api/fournisseurs/{id}", "FOURNISSEURS_DELETE");
        
        map.put("GET:/api/categories", "CATEGORIES_VIEW");
        map.put("POST:/api/categories", "CATEGORIES_CREATE");
        map.put("PUT:/api/categories/{id}", "CATEGORIES_EDIT");
        map.put("DELETE:/api/categories/{id}", "CATEGORIES_DELETE");
        
        map.put("GET:/api/langues", "LANGUES_VIEW");
        map.put("POST:/api/langues", "LANGUES_CREATE");
        map.put("PUT:/api/langues/{id}", "LANGUES_EDIT");
        map.put("DELETE:/api/langues/{id}", "LANGUES_DELETE");
        
        map.put("GET:/api/rapports", "REPORTS_VIEW");
        map.put("GET:/api/statistiques/dashboard", "REPORTS_DASHBOARD");
        
        map.put("GET:/api/utilisateurs/me", "PROFILE_VIEW");
        map.put("PUT:/api/utilisateurs/me", "PROFILE_EDIT");
        map.put("PUT:/api/utilisateurs/me/password", "PROFILE_PASSWORD");
        
        return map;
    }
    
    /**
     * Obtient la permission requise pour un endpoint
     */
    public static String getRequiredPermission(String method, String path) {
        String key = method + ":" + path;
        
        // Recherche exacte d'abord
        String permission = ENDPOINT_PERMISSIONS.get(key);
        if (permission != null) {
            return permission;
        }
        
        // Recherche avec patterns (pour les IDs dynamiques)
        for (Map.Entry<String, String> entry : ENDPOINT_PERMISSIONS.entrySet()) {
            String pattern = entry.getKey();
            if (matchesPattern(key, pattern)) {
                return entry.getValue();
            }
        }
        
        return null;
    }
    
    /**
     * Vérifie si un endpoint correspond à un pattern
     */
    private static boolean matchesPattern(String endpoint, String pattern) {
        // Remplace {id} par une regex pour matcher les IDs
        String regex = pattern.replaceAll("\\{[^}]+\\}", "[^/]+");
        return endpoint.matches(regex);
    }
}