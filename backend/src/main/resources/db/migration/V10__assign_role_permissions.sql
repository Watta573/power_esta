-- V10__assign_role_permissions.sql
-- Attribution des permissions par rôle selon les standards des grandes bibliothèques

-- ===== FONCTION HELPER POUR ATTRIBUTION =====
CREATE OR REPLACE FUNCTION assign_permissions_to_role(role_name VARCHAR, permission_codes TEXT[])
RETURNS VOID AS $$
DECLARE
    perm_code TEXT;
BEGIN
    FOREACH perm_code IN ARRAY permission_codes
    LOOP
        INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
        SELECT u.id, p.id, true, 'Attribution automatique rôle ' || role_name
        FROM utilisateurs u, permissions p
        WHERE u.role = role_name AND p.code = perm_code
        ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===== PERMISSIONS POUR PUBLIC =====
-- Accès minimal : consultation uniquement
SELECT assign_permissions_to_role('PUBLIC', ARRAY[
    'LIVRES_VIEW',
    'LIVRES_SEARCH',
    'EXEMPLAIRES_VIEW',
    'CATEGORIES_VIEW',
    'PROFILE_VIEW',
    'PROFILE_EDIT',
    'PROFILE_PASSWORD'
]);

-- ===== PERMISSIONS POUR ÉTUDIANT =====
-- Consultation + emprunts personnels + réservations + suggestions
SELECT assign_permissions_to_role('ETUDIANT', ARRAY[
    -- Consultation
    'LIVRES_VIEW',
    'LIVRES_SEARCH',
    'EXEMPLAIRES_VIEW',
    'CATEGORIES_VIEW',
    'LANGUES_VIEW',
    
    -- Emprunts personnels
    'EMPRUNTS_VIEW',
    'EMPRUNTS_EXTEND',
    'EMPRUNTS_HISTORY',
    
    -- Réservations
    'RESERVATIONS_VIEW',
    'RESERVATIONS_CREATE',
    'RESERVATIONS_CANCEL',
    
    -- Suggestions d''achat
    'ACQUISITIONS_SUGGEST',
    
    -- Profil personnel
    'PROFILE_VIEW',
    'PROFILE_EDIT',
    'PROFILE_PASSWORD',
    'PROFILE_NOTIFICATIONS',
    
    -- Finances personnelles
    'FINANCES_AMENDES_VIEW',
    'FINANCES_COTISATIONS_VIEW'
]);

-- ===== PERMISSIONS POUR ENSEIGNANT =====
-- Toutes permissions étudiant + emprunts étendus + rapports limités
SELECT assign_permissions_to_role('ENSEIGNANT', ARRAY[
    -- Consultation étendue
    'LIVRES_VIEW',
    'LIVRES_SEARCH',
    'EXEMPLAIRES_VIEW',
    'CATEGORIES_VIEW',
    'LANGUES_VIEW',
    
    -- Emprunts étendus
    'EMPRUNTS_VIEW',
    'EMPRUNTS_CREATE',
    'EMPRUNTS_EXTEND',
    'EMPRUNTS_HISTORY',
    
    -- Réservations complètes
    'RESERVATIONS_VIEW',
    'RESERVATIONS_CREATE',
    'RESERVATIONS_CANCEL',
    
    -- Acquisitions privilégiées
    'ACQUISITIONS_VIEW',
    'ACQUISITIONS_SUGGEST',
    
    -- Profil complet
    'PROFILE_VIEW',
    'PROFILE_EDIT',
    'PROFILE_PASSWORD',
    'PROFILE_NOTIFICATIONS',
    
    -- Finances
    'FINANCES_AMENDES_VIEW',
    'FINANCES_COTISATIONS_VIEW',
    
    -- Rapports limités
    'REPORTS_VIEW',
    'REPORTS_LOANS'
]);

-- ===== PERMISSIONS POUR BIBLIOTHÉCAIRE =====
-- Gestion opérationnelle complète (sans administration système)
SELECT assign_permissions_to_role('BIBLIOTHECAIRE', ARRAY[
    -- Gestion complète des livres
    'LIVRES_VIEW',
    'LIVRES_SEARCH',
    'LIVRES_CREATE',
    'LIVRES_EDIT',
    'LIVRES_IMPORT',
    'LIVRES_EXPORT',
    
    -- Gestion des exemplaires
    'EXEMPLAIRES_VIEW',
    'EXEMPLAIRES_CREATE',
    'EXEMPLAIRES_EDIT',
    'EXEMPLAIRES_STATUS',
    
    -- Gestion complète des emprunts
    'EMPRUNTS_VIEW',
    'EMPRUNTS_VIEW_ALL',
    'EMPRUNTS_CREATE',
    'EMPRUNTS_RETURN',
    'EMPRUNTS_EXTEND',
    'EMPRUNTS_CANCEL',
    'EMPRUNTS_HISTORY',
    'EMPRUNTS_EXPORT',
    
    -- Gestion des réservations
    'RESERVATIONS_VIEW',
    'RESERVATIONS_VIEW_ALL',
    'RESERVATIONS_CREATE',
    'RESERVATIONS_CANCEL',
    'RESERVATIONS_PROCESS',
    'RESERVATIONS_EXPORT',
    
    -- Gestion des finances
    'FINANCES_VIEW',
    'FINANCES_AMENDES_VIEW',
    'FINANCES_AMENDES_COLLECT',
    'FINANCES_COTISATIONS_VIEW',
    'FINANCES_COTISATIONS_CREATE',
    'FINANCES_COTISATIONS_EDIT',
    'FINANCES_REPORTS',
    'FINANCES_EXPORT',
    
    -- Acquisitions
    'ACQUISITIONS_VIEW',
    'ACQUISITIONS_SUGGEST',
    'ACQUISITIONS_APPROVE',
    'ACQUISITIONS_REJECT',
    'ACQUISITIONS_ORDERS_VIEW',
    'ACQUISITIONS_ORDERS_CREATE',
    'ACQUISITIONS_ORDERS_EDIT',
    'ACQUISITIONS_DELIVERY',
    'ACQUISITIONS_BUDGET',
    'ACQUISITIONS_EXPORT',
    
    -- Gestion des fournisseurs
    'FOURNISSEURS_VIEW',
    'FOURNISSEURS_CREATE',
    'FOURNISSEURS_EDIT',
    
    -- Gestion des catégories et langues
    'CATEGORIES_VIEW',
    'CATEGORIES_CREATE',
    'CATEGORIES_EDIT',
    'LANGUES_VIEW',
    'LANGUES_CREATE',
    'LANGUES_EDIT',
    
    -- Communication
    'COMMUNICATION_VIEW',
    'COMMUNICATION_SEND',
    'COMMUNICATION_EMAIL',
    
    -- Rapports opérationnels
    'REPORTS_VIEW',
    'REPORTS_DASHBOARD',
    'REPORTS_LOANS',
    'REPORTS_USERS',
    'REPORTS_FINANCIAL',
    'REPORTS_INVENTORY',
    'REPORTS_EXPORT',
    'REPORTS_PRINT',
    
    -- Relances
    'RELANCES_VIEW',
    'RELANCES_SEND',
    'RELANCES_MANUAL',
    
    -- Export/Import opérationnel
    'EXPORT_BOOKS',
    'EXPORT_LOANS',
    'EXPORT_FINANCIAL',
    'IMPORT_BOOKS',
    
    -- Profil
    'PROFILE_VIEW',
    'PROFILE_EDIT',
    'PROFILE_PASSWORD',
    'PROFILE_NOTIFICATIONS'
]);

-- ===== PERMISSIONS POUR ADMIN =====
-- Toutes les permissions (gestion système + toutes les opérationnelles)
INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
SELECT u.id, p.id, true, 'Attribution automatique rôle ADMIN - Accès complet'
FROM utilisateurs u, permissions p
WHERE u.role = 'ADMIN'
ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;

-- Supprimer la fonction helper
DROP FUNCTION assign_permissions_to_role(VARCHAR, TEXT[]);