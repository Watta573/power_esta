-- Script de nettoyage et réapplication des permissions selon les standards

-- 1. Supprimer toutes les permissions utilisateur existantes
DELETE FROM utilisateur_permissions;

-- 2. Exécuter les scripts de permissions
-- Vous devez exécuter dans l'ordre :
-- 1. all_permissions_complete.sql (pour avoir toutes les permissions)
-- 2. Ce script pour attribuer par rôle

-- 3. Attribution automatique par rôle
DO $$
DECLARE
    user_record RECORD;
    perm_record RECORD;
BEGIN
    -- Pour chaque utilisateur
    FOR user_record IN SELECT id, role FROM utilisateurs LOOP
        
        -- Attribution selon le rôle
        CASE user_record.role
            WHEN 'PUBLIC' THEN
                -- Permissions minimales pour PUBLIC
                INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
                SELECT user_record.id, p.id, true, 'Auto-assigné PUBLIC'
                FROM permissions p
                WHERE p.code IN (
                    'LIVRES_VIEW', 'LIVRES_SEARCH', 'EXEMPLAIRES_VIEW', 'CATEGORIES_VIEW',
                    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD'
                )
                ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
                
            WHEN 'ETUDIANT' THEN
                -- Permissions étudiant
                INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
                SELECT user_record.id, p.id, true, 'Auto-assigné ETUDIANT'
                FROM permissions p
                WHERE p.code IN (
                    'LIVRES_VIEW', 'LIVRES_SEARCH', 'EXEMPLAIRES_VIEW', 'CATEGORIES_VIEW', 'LANGUES_VIEW',
                    'EMPRUNTS_VIEW', 'EMPRUNTS_EXTEND', 'EMPRUNTS_HISTORY',
                    'RESERVATIONS_VIEW', 'RESERVATIONS_CREATE', 'RESERVATIONS_CANCEL',
                    'ACQUISITIONS_SUGGEST',
                    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD', 'PROFILE_NOTIFICATIONS',
                    'FINANCES_AMENDES_VIEW', 'FINANCES_COTISATIONS_VIEW'
                )
                ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
                
            WHEN 'ENSEIGNANT' THEN
                -- Permissions enseignant
                INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
                SELECT user_record.id, p.id, true, 'Auto-assigné ENSEIGNANT'
                FROM permissions p
                WHERE p.code IN (
                    'LIVRES_VIEW', 'LIVRES_SEARCH', 'EXEMPLAIRES_VIEW', 'CATEGORIES_VIEW', 'LANGUES_VIEW',
                    'EMPRUNTS_VIEW', 'EMPRUNTS_CREATE', 'EMPRUNTS_EXTEND', 'EMPRUNTS_HISTORY',
                    'RESERVATIONS_VIEW', 'RESERVATIONS_CREATE', 'RESERVATIONS_CANCEL',
                    'ACQUISITIONS_VIEW', 'ACQUISITIONS_SUGGEST',
                    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD', 'PROFILE_NOTIFICATIONS',
                    'FINANCES_AMENDES_VIEW', 'FINANCES_COTISATIONS_VIEW',
                    'REPORTS_VIEW', 'REPORTS_LOANS'
                )
                ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
                
            WHEN 'BIBLIOTHECAIRE' THEN
                -- Permissions bibliothécaire (gestion opérationnelle)
                INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
                SELECT user_record.id, p.id, true, 'Auto-assigné BIBLIOTHECAIRE'
                FROM permissions p
                WHERE p.code NOT LIKE 'ADMIN_%' -- Exclure les permissions admin
                ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
                
            WHEN 'ADMIN' THEN
                -- Toutes les permissions pour admin
                INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
                SELECT user_record.id, p.id, true, 'Auto-assigné ADMIN'
                FROM permissions p
                ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
                
        END CASE;
    END LOOP;
    
    RAISE NOTICE 'Permissions attribuées avec succès selon les rôles';
END $$;