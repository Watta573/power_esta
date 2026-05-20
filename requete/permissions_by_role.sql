-- Attribution des permissions par rôle selon les bonnes pratiques des bibliothèques

-- ===== PERMISSIONS POUR ÉTUDIANT =====
INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
SELECT u.id, p.id, true, 'Attribution automatique rôle ETUDIANT'
FROM utilisateurs u, permissions p
WHERE u.role = 'ETUDIANT' 
AND p.code IN (
    -- Consultation
    'LIVRES_VIEW', 'LIVRES_SEARCH',
    'EXEMPLAIRES_VIEW',
    'CATEGORIES_VIEW', 'LANGUES_VIEW',
    
    -- Emprunts personnels
    'EMPRUNTS_VIEW', 'EMPRUNTS_EXTEND', 'EMPRUNTS_HISTORY',
    
    -- Réservations
    'RESERVATIONS_VIEW', 'RESERVATIONS_CREATE', 'RESERVATIONS_CANCEL',
    
    -- Suggestions
    'ACQUISITIONS_SUGGEST',
    
    -- Profil
    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD', 'PROFILE_NOTIFICATIONS',
    
    -- Finances personnelles
    'FINANCES_AMENDES_VIEW', 'FINANCES_COTISATIONS_VIEW'
)
ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;

-- ===== PERMISSIONS POUR PUBLIC =====
INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
SELECT u.id, p.id, true, 'Attribution automatique rôle PUBLIC'
FROM utilisateurs u, permissions p
WHERE u.role = 'PUBLIC' 
AND p.code IN (
    -- Consultation limitée
    'LIVRES_VIEW', 'LIVRES_SEARCH',
    'EXEMPLAIRES_VIEW',
    'CATEGORIES_VIEW',
    
    -- Profil minimal
    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD',
    
    -- Réservations limitées
    'RESERVATIONS_VIEW', 'RESERVATIONS_CREATE'
)
ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;

-- ===== PERMISSIONS POUR ENSEIGNANT =====
INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
SELECT u.id, p.id, true, 'Attribution automatique rôle ENSEIGNANT'
FROM utilisateurs u, permissions p
WHERE u.role = 'ENSEIGNANT' 
AND p.code IN (
    -- Toutes les permissions étudiant
    'LIVRES_VIEW', 'LIVRES_SEARCH',
    'EXEMPLAIRES_VIEW',
    'CATEGORIES_VIEW', 'LANGUES_VIEW',
    
    -- Emprunts étendus
    'EMPRUNTS_VIEW', 'EMPRUNTS_CREATE', 'EMPRUNTS_EXTEND', 'EMPRUNTS_HISTORY',
    
    -- Réservations complètes
    'RESERVATIONS_VIEW', 'RESERVATIONS_CREATE', 'RESERVATIONS_CANCEL',
    
    -- Acquisitions privilégiées
    'ACQUISITIONS_VIEW', 'ACQUISITIONS_SUGGEST',
    
    -- Profil complet
    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD', 'PROFILE_NOTIFICATIONS',
    
    -- Finances
    'FINANCES_AMENDES_VIEW', 'FINANCES_COTISATIONS_VIEW',
    
    -- Rapports limités
    'REPORTS_VIEW', 'REPORTS_LOANS'
)
ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;

-- ===== PERMISSIONS POUR BIBLIOTHÉCAIRE =====
INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
SELECT u.id, p.id, true, 'Attribution automatique rôle BIBLIOTHECAIRE'
FROM utilisateurs u, permissions p
WHERE u.role = 'BIBLIOTHECAIRE' 
AND p.code IN (
    -- Gestion complète des livres
    'LIVRES_VIEW', 'LIVRES_SEARCH', 'LIVRES_CREATE', 'LIVRES_EDIT', 'LIVRES_IMPORT', 'LIVRES_EXPORT',
    
    -- Gestion des exemplaires
    'EXEMPLAIRES_VIEW', 'EXEMPLAIRES_CREATE', 'EXEMPLAIRES_EDIT', 'EXEMPLAIRES_STATUS',
    
    -- Gestion complète des emprunts
    'EMPRUNTS_VIEW', 'EMPRUNTS_VIEW_ALL', 'EMPRUNTS_CREATE', 'EMPRUNTS_RETURN', 'EMPRUNTS_EXTEND', 'EMPRUNTS_CANCEL', 'EMPRUNTS_HISTORY', 'EMPRUNTS_EXPORT',
    
    -- Gestion des réservations
    'RESERVATIONS_VIEW', 'RESERVATIONS_VIEW_ALL', 'RESERVATIONS_CREATE', 'RESERVATIONS_CANCEL', 'RESERVATIONS_PROCESS', 'RESERVATIONS_EXPORT',
    
    -- Gestion des finances
    'FINANCES_VIEW', 'FINANCES_AMENDES_VIEW', 'FINANCES_AMENDES_COLLECT', 'FINANCES_COTISATIONS_VIEW', 'FINANCES_COTISATIONS_CREATE', 'FINANCES_COTISATIONS_EDIT',
    
    -- Acquisitions
    'ACQUISITIONS_VIEW', 'ACQUISITIONS_SUGGEST', 'ACQUISITIONS_APPROVE', 'ACQUISITIONS_REJECT', 'ACQUISITIONS_ORDERS_VIEW', 'ACQUISITIONS_ORDERS_CREATE', 'ACQUISITIONS_DELIVERY',
    
    -- Gestion des catégories
    'CATEGORIES_VIEW', 'CATEGORIES_CREATE', 'CATEGORIES_EDIT',
    'LANGUES_VIEW', 'LANGUES_CREATE', 'LANGUES_EDIT',
    
    -- Communication
    'COMMUNICATION_VIEW', 'COMMUNICATION_SEND',
    
    -- Rapports
    'REPORTS_VIEW', 'REPORTS_DASHBOARD', 'REPORTS_LOANS', 'REPORTS_USERS', 'REPORTS_INVENTORY', 'REPORTS_EXPORT',
    
    -- Relances
    'RELANCES_VIEW', 'RELANCES_SEND', 'RELANCES_MANUAL',
    
    -- Profil
    'PROFILE_VIEW', 'PROFILE_EDIT', 'PROFILE_PASSWORD', 'PROFILE_NOTIFICATIONS'
)
ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;

-- ===== PERMISSIONS POUR ADMIN =====
-- L'admin a toutes les permissions (déjà géré par le système de rôles)