-- V9__complete_permissions_system.sql
-- Système de permissions granulaires COMPLET

-- ========== INSERTION DE TOUTES LES PERMISSIONS ==========

INSERT INTO permissions (code, nom, description, module) VALUES

-- ===== MODULE ADMINISTRATION =====
('ADMIN_USERS_VIEW', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'ADMINISTRATION'),
('ADMIN_USERS_CREATE', 'Créer des utilisateurs', 'Ajouter de nouveaux utilisateurs', 'ADMINISTRATION'),
('ADMIN_USERS_EDIT', 'Modifier les utilisateurs', 'Éditer les informations des utilisateurs', 'ADMINISTRATION'),
('ADMIN_USERS_DELETE', 'Supprimer les utilisateurs', 'Supprimer des comptes utilisateurs', 'ADMINISTRATION'),
('ADMIN_USERS_ACTIVATE', 'Activer/Désactiver utilisateurs', 'Changer le statut actif des utilisateurs', 'ADMINISTRATION'),
('ADMIN_ROLES_MANAGE', 'Gérer les rôles', 'Modifier les rôles des utilisateurs', 'ADMINISTRATION'),
('ADMIN_PERMISSIONS_MANAGE', 'Gérer les permissions', 'Accorder/révoquer des permissions', 'ADMINISTRATION'),
('ADMIN_AUDIT_VIEW', 'Voir les logs d\'audit', 'Consulter le journal d\'activités', 'ADMINISTRATION'),
('ADMIN_SYSTEM_CONFIG', 'Configuration système', 'Modifier les paramètres système', 'ADMINISTRATION'),

-- ===== MODULE LIVRES =====
('LIVRES_VIEW', 'Voir le catalogue', 'Consulter le catalogue de livres', 'LIVRES'),
('LIVRES_SEARCH', 'Rechercher des livres', 'Utiliser la recherche avancée', 'LIVRES'),
('LIVRES_CREATE', 'Ajouter des livres', 'Créer de nouveaux livres', 'LIVRES'),
('LIVRES_EDIT', 'Modifier des livres', 'Éditer les informations des livres', 'LIVRES'),
('LIVRES_DELETE', 'Supprimer des livres', 'Supprimer des livres du catalogue', 'LIVRES'),
('LIVRES_IMPORT', 'Importer des livres', 'Importer en masse des livres', 'LIVRES'),
('LIVRES_EXPORT', 'Exporter des livres', 'Exporter la liste des livres', 'LIVRES'),

-- ===== MODULE EXEMPLAIRES =====
('EXEMPLAIRES_VIEW', 'Voir les exemplaires', 'Consulter les exemplaires disponibles', 'EXEMPLAIRES'),
('EXEMPLAIRES_CREATE', 'Ajouter des exemplaires', 'Créer de nouveaux exemplaires', 'EXEMPLAIRES'),
('EXEMPLAIRES_EDIT', 'Modifier des exemplaires', 'Éditer les exemplaires', 'EXEMPLAIRES'),
('EXEMPLAIRES_DELETE', 'Supprimer des exemplaires', 'Supprimer des exemplaires', 'EXEMPLAIRES'),
('EXEMPLAIRES_STATUS', 'Changer statut exemplaires', 'Modifier l\'état des exemplaires', 'EXEMPLAIRES'),

-- ===== MODULE EMPRUNTS =====
('EMPRUNTS_VIEW', 'Voir les emprunts', 'Consulter les emprunts', 'EMPRUNTS'),
('EMPRUNTS_VIEW_ALL', 'Voir tous les emprunts', 'Consulter tous les emprunts (pas seulement les siens)', 'EMPRUNTS'),
('EMPRUNTS_CREATE', 'Créer des emprunts', 'Enregistrer de nouveaux emprunts', 'EMPRUNTS'),
('EMPRUNTS_RETURN', 'Retourner des livres', 'Traiter les retours de livres', 'EMPRUNTS'),
('EMPRUNTS_EXTEND', 'Prolonger des emprunts', 'Étendre la durée d\'emprunt', 'EMPRUNTS'),
('EMPRUNTS_CANCEL', 'Annuler des emprunts', 'Annuler des emprunts en cours', 'EMPRUNTS'),
('EMPRUNTS_HISTORY', 'Voir l\'historique', 'Consulter l\'historique des emprunts', 'EMPRUNTS'),
('EMPRUNTS_EXPORT', 'Exporter les emprunts', 'Exporter les données d\'emprunts', 'EMPRUNTS'),

-- ===== MODULE RÉSERVATIONS =====
('RESERVATIONS_VIEW', 'Voir les réservations', 'Consulter les réservations', 'RESERVATIONS'),
('RESERVATIONS_VIEW_ALL', 'Voir toutes les réservations', 'Consulter toutes les réservations', 'RESERVATIONS'),
('RESERVATIONS_CREATE', 'Créer des réservations', 'Faire des réservations', 'RESERVATIONS'),
('RESERVATIONS_CANCEL', 'Annuler des réservations', 'Annuler des réservations', 'RESERVATIONS'),
('RESERVATIONS_PROCESS', 'Traiter les réservations', 'Convertir réservations en emprunts', 'RESERVATIONS'),
('RESERVATIONS_EXPORT', 'Exporter les réservations', 'Exporter les données de réservations', 'RESERVATIONS'),

-- ===== MODULE FINANCES =====
('FINANCES_VIEW', 'Voir les finances', 'Consulter les données financières', 'FINANCES'),
('FINANCES_AMENDES_VIEW', 'Voir les amendes', 'Consulter les amendes', 'FINANCES'),
('FINANCES_AMENDES_COLLECT', 'Encaisser les amendes', 'Traiter les paiements d\'amendes', 'FINANCES'),
('FINANCES_COTISATIONS_VIEW', 'Voir les cotisations', 'Consulter les cotisations', 'FINANCES'),
('FINANCES_COTISATIONS_CREATE', 'Créer des cotisations', 'Enregistrer de nouvelles cotisations', 'FINANCES'),
('FINANCES_COTISATIONS_EDIT', 'Modifier des cotisations', 'Éditer les cotisations', 'FINANCES'),
('FINANCES_COTISATIONS_CANCEL', 'Annuler des cotisations', 'Annuler des cotisations', 'FINANCES'),
('FINANCES_REPORTS', 'Rapports financiers', 'Générer des rapports financiers', 'FINANCES'),
('FINANCES_EXPORT', 'Exporter les finances', 'Exporter les données financières', 'FINANCES'),

-- ===== MODULE ACQUISITIONS =====
('ACQUISITIONS_VIEW', 'Voir les acquisitions', 'Consulter les suggestions et commandes', 'ACQUISITIONS'),
('ACQUISITIONS_SUGGEST', 'Suggérer des titres', 'Proposer des livres à acheter', 'ACQUISITIONS'),
('ACQUISITIONS_APPROVE', 'Approuver des suggestions', 'Valider les suggestions d\'achat', 'ACQUISITIONS'),
('ACQUISITIONS_REJECT', 'Rejeter des suggestions', 'Refuser les suggestions d\'achat', 'ACQUISITIONS'),
('ACQUISITIONS_ORDERS_VIEW', 'Voir les commandes', 'Consulter les commandes d\'achat', 'ACQUISITIONS'),
('ACQUISITIONS_ORDERS_CREATE', 'Créer des commandes', 'Passer des commandes d\'achat', 'ACQUISITIONS'),
('ACQUISITIONS_ORDERS_EDIT', 'Modifier des commandes', 'Éditer les commandes', 'ACQUISITIONS'),
('ACQUISITIONS_ORDERS_CANCEL', 'Annuler des commandes', 'Annuler des commandes', 'ACQUISITIONS'),
('ACQUISITIONS_DELIVERY', 'Marquer livré', 'Confirmer la réception des commandes', 'ACQUISITIONS'),
('ACQUISITIONS_BUDGET', 'Voir le budget', 'Consulter le suivi budgétaire', 'ACQUISITIONS'),
('ACQUISITIONS_EXPORT', 'Exporter acquisitions', 'Exporter les données d\'acquisitions', 'ACQUISITIONS'),

-- ===== MODULE FOURNISSEURS =====
('FOURNISSEURS_VIEW', 'Voir les fournisseurs', 'Consulter la liste des fournisseurs', 'FOURNISSEURS'),
('FOURNISSEURS_CREATE', 'Ajouter des fournisseurs', 'Créer de nouveaux fournisseurs', 'FOURNISSEURS'),
('FOURNISSEURS_EDIT', 'Modifier des fournisseurs', 'Éditer les fournisseurs', 'FOURNISSEURS'),
('FOURNISSEURS_DELETE', 'Supprimer des fournisseurs', 'Supprimer des fournisseurs', 'FOURNISSEURS'),

-- ===== MODULE PÉRIODIQUES =====
('PERIODIQUES_VIEW', 'Voir les périodiques', 'Consulter les périodiques', 'PERIODIQUES'),
('PERIODIQUES_CREATE', 'Ajouter des périodiques', 'Créer de nouveaux périodiques', 'PERIODIQUES'),
('PERIODIQUES_EDIT', 'Modifier des périodiques', 'Éditer les périodiques', 'PERIODIQUES'),
('PERIODIQUES_DELETE', 'Supprimer des périodiques', 'Supprimer des périodiques', 'PERIODIQUES'),
('PERIODIQUES_NUMBERS_MANAGE', 'Gérer les numéros', 'Ajouter/modifier les numéros', 'PERIODIQUES'),

-- ===== MODULE CATÉGORIES =====
('CATEGORIES_VIEW', 'Voir les catégories', 'Consulter les catégories', 'CATEGORIES'),
('CATEGORIES_CREATE', 'Créer des catégories', 'Ajouter de nouvelles catégories', 'CATEGORIES'),
('CATEGORIES_EDIT', 'Modifier des catégories', 'Éditer les catégories', 'CATEGORIES'),
('CATEGORIES_DELETE', 'Supprimer des catégories', 'Supprimer des catégories', 'CATEGORIES'),

-- ===== MODULE LANGUES =====
('LANGUES_VIEW', 'Voir les langues', 'Consulter les langues disponibles', 'LANGUES'),
('LANGUES_CREATE', 'Ajouter des langues', 'Créer de nouvelles langues', 'LANGUES'),
('LANGUES_EDIT', 'Modifier des langues', 'Éditer les langues', 'LANGUES'),
('LANGUES_DELETE', 'Supprimer des langues', 'Supprimer des langues', 'LANGUES'),

-- ===== MODULE COMMUNICATION =====
('COMMUNICATION_VIEW', 'Voir les notifications', 'Consulter les notifications', 'COMMUNICATION'),
('COMMUNICATION_SEND', 'Envoyer des notifications', 'Créer et envoyer des notifications', 'COMMUNICATION'),
('COMMUNICATION_BROADCAST', 'Diffusion générale', 'Envoyer des messages à tous', 'COMMUNICATION'),
('COMMUNICATION_EMAIL', 'Notifications email', 'Gérer les notifications par email', 'COMMUNICATION'),
('COMMUNICATION_SMS', 'Notifications SMS', 'Gérer les notifications par SMS', 'COMMUNICATION'),

-- ===== MODULE RAPPORTS =====
('REPORTS_VIEW', 'Voir les rapports', 'Consulter les rapports et statistiques', 'RAPPORTS'),
('REPORTS_DASHBOARD', 'Tableau de bord', 'Accéder au tableau de bord', 'RAPPORTS'),
('REPORTS_LOANS', 'Rapports d\'emprunts', 'Générer des rapports d\'emprunts', 'RAPPORTS'),
('REPORTS_USERS', 'Rapports utilisateurs', 'Générer des rapports sur les utilisateurs', 'RAPPORTS'),
('REPORTS_FINANCIAL', 'Rapports financiers', 'Générer des rapports financiers', 'RAPPORTS'),
('REPORTS_INVENTORY', 'Rapports d\'inventaire', 'Générer des rapports d\'inventaire', 'RAPPORTS'),
('REPORTS_EXPORT', 'Exporter les rapports', 'Exporter les rapports en PDF/Excel', 'RAPPORTS'),
('REPORTS_PRINT', 'Imprimer les rapports', 'Imprimer les rapports', 'RAPPORTS'),

-- ===== MODULE RELANCES =====
('RELANCES_VIEW', 'Voir les relances', 'Consulter les relances et amendes', 'RELANCES'),
('RELANCES_SEND', 'Envoyer des relances', 'Envoyer des rappels aux retardataires', 'RELANCES'),
('RELANCES_AUTO', 'Relances automatiques', 'Configurer les relances automatiques', 'RELANCES'),
('RELANCES_MANUAL', 'Relances manuelles', 'Envoyer des relances personnalisées', 'RELANCES'),

-- ===== MODULE SÉCURITÉ =====
('SECURITY_2FA_MANAGE', 'Gérer 2FA', 'Configurer l\'authentification à deux facteurs', 'SECURITY'),
('SECURITY_SESSIONS_VIEW', 'Voir les sessions', 'Consulter les sessions actives', 'SECURITY'),
('SECURITY_SESSIONS_KILL', 'Terminer des sessions', 'Forcer la déconnexion d\'utilisateurs', 'SECURITY'),
('SECURITY_LOGS_VIEW', 'Voir les logs de sécurité', 'Consulter les tentatives de connexion', 'SECURITY'),
('SECURITY_BACKUP', 'Sauvegardes', 'Gérer les sauvegardes système', 'SECURITY'),

-- ===== MODULE PROFIL =====
('PROFILE_VIEW', 'Voir son profil', 'Consulter ses informations personnelles', 'PROFIL'),
('PROFILE_EDIT', 'Modifier son profil', 'Éditer ses informations personnelles', 'PROFIL'),
('PROFILE_PASSWORD', 'Changer mot de passe', 'Modifier son mot de passe', 'PROFIL'),
('PROFILE_2FA', 'Configurer 2FA', 'Activer/désactiver son 2FA', 'PROFIL'),
('PROFILE_NOTIFICATIONS', 'Préférences notifications', 'Gérer ses préférences de notifications', 'PROFIL'),

-- ===== MODULE EXPORT/IMPORT =====
('EXPORT_USERS', 'Exporter utilisateurs', 'Exporter la liste des utilisateurs', 'EXPORT'),
('EXPORT_BOOKS', 'Exporter livres', 'Exporter le catalogue de livres', 'EXPORT'),
('EXPORT_LOANS', 'Exporter emprunts', 'Exporter les données d\'emprunts', 'EXPORT'),
('EXPORT_FINANCIAL', 'Exporter finances', 'Exporter les données financières', 'EXPORT'),
('IMPORT_BOOKS', 'Importer livres', 'Importer des livres en masse', 'IMPORT'),
('IMPORT_USERS', 'Importer utilisateurs', 'Importer des utilisateurs en masse', 'IMPORT'),

-- ===== MODULE API =====
('API_ACCESS', 'Accès API', 'Utiliser l\'API REST', 'API'),
('API_ADMIN', 'API Admin', 'Accès aux endpoints d\'administration', 'API'),
('API_READ_ONLY', 'API Lecture seule', 'Accès en lecture seule à l\'API', 'API'),
('API_WRITE', 'API Écriture', 'Accès en écriture à l\'API', 'API');