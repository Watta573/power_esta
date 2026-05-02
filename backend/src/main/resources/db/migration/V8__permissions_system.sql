-- V8__permissions_system.sql
-- Système de permissions granulaires

-- Table des permissions
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    nom VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    module VARCHAR(50) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index pour les permissions
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_module ON permissions(module);

-- Table de liaison utilisateur-permissions
CREATE TABLE utilisateur_permissions (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    accorde BOOLEAN NOT NULL DEFAULT TRUE,
    date_accord TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accorde_par_id BIGINT,
    notes VARCHAR(500),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (accorde_par_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    UNIQUE (utilisateur_id, permission_id)
);

-- Index pour les permissions utilisateur
CREATE INDEX idx_user_permissions_user ON utilisateur_permissions(utilisateur_id);
CREATE INDEX idx_user_permissions_permission ON utilisateur_permissions(permission_id);

-- Insertion des permissions de base
INSERT INTO permissions (code, nom, description, module) VALUES
-- Module Finances
('FINANCES_VIEW', 'Voir les finances', 'Consulter les amendes et cotisations', 'FINANCES'),
('FINANCES_MANAGE', 'Gérer les finances', 'Créer et modifier les cotisations, encaisser les amendes', 'FINANCES'),

-- Module Acquisitions
('ACQUISITIONS_VIEW', 'Voir les acquisitions', 'Consulter les suggestions et commandes', 'ACQUISITIONS'),
('ACQUISITIONS_MANAGE', 'Gérer les acquisitions', 'Approuver les suggestions, créer des commandes', 'ACQUISITIONS'),

-- Module Emprunts
('EMPRUNTS_VIEW', 'Voir les emprunts', 'Consulter les emprunts et réservations', 'EMPRUNTS'),
('EMPRUNTS_MANAGE', 'Gérer les emprunts', 'Créer et modifier les emprunts', 'EMPRUNTS'),

-- Module Administration
('USERS_MANAGE', 'Gérer les utilisateurs', 'Créer, modifier et désactiver les utilisateurs', 'ADMINISTRATION'),
('REPORTS_VIEW', 'Voir les rapports', 'Accéder aux statistiques et rapports', 'ADMINISTRATION'),

-- Module Communication
('COMMUNICATION_VIEW', 'Voir les notifications', 'Consulter les notifications', 'COMMUNICATION'),
('COMMUNICATION_MANAGE', 'Gérer les notifications', 'Envoyer et gérer les notifications', 'COMMUNICATION');