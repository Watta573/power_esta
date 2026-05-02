-- V1__init_schema.sql
-- Schéma initial de la bibliothèque universitaire

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    couleur     VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS utilisateurs (
    id               BIGSERIAL PRIMARY KEY,
    nom              VARCHAR(120)  NOT NULL,
    prenom           VARCHAR(120)  NOT NULL,
    identifiant      VARCHAR(32)   NOT NULL UNIQUE,
    email            VARCHAR(180)  NOT NULL UNIQUE,
    password         VARCHAR(255)  NOT NULL,
    telephone        VARCHAR(30),
    role             VARCHAR(30)   NOT NULL,
    actif            BOOLEAN       NOT NULL DEFAULT TRUE,
    date_inscription DATE          NOT NULL DEFAULT CURRENT_DATE,
    date_creation    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livres (
    id                BIGSERIAL PRIMARY KEY,
    titre             VARCHAR(255) NOT NULL,
    isbn              VARCHAR(20)  NOT NULL UNIQUE,
    auteur            VARCHAR(180) NOT NULL,
    editeur           VARCHAR(180),
    edition           VARCHAR(50),
    annee_publication INTEGER,
    categorie_id      BIGINT       NOT NULL REFERENCES categories(id),
    langue            VARCHAR(80),
    description       TEXT,
    couverture        VARCHAR(255),
    date_ajout        DATE         NOT NULL DEFAULT CURRENT_DATE,
    actif             BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exemplaires (
    id               BIGSERIAL PRIMARY KEY,
    livre_id         BIGINT      NOT NULL REFERENCES livres(id),
    code_exemplaire  VARCHAR(40) NOT NULL UNIQUE,
    etat             VARCHAR(20) NOT NULL DEFAULT 'BON',
    disponible       BOOLEAN     NOT NULL DEFAULT TRUE,
    localisation     VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS emprunts (
    id                     BIGSERIAL PRIMARY KEY,
    utilisateur_id         BIGINT         NOT NULL REFERENCES utilisateurs(id),
    exemplaire_id          BIGINT         NOT NULL REFERENCES exemplaires(id),
    date_emprunt           DATE           NOT NULL DEFAULT CURRENT_DATE,
    date_retour_prevue     DATE           NOT NULL,
    date_retour_effective  DATE,
    statut                 VARCHAR(20)    NOT NULL DEFAULT 'EN_COURS',
    nombre_renouvellements INTEGER        NOT NULL DEFAULT 0,
    amende                 NUMERIC(12,2)  NOT NULL DEFAULT 0,
    notes                  TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
    id               BIGSERIAL PRIMARY KEY,
    utilisateur_id   BIGINT      NOT NULL REFERENCES utilisateurs(id),
    livre_id         BIGINT      NOT NULL REFERENCES livres(id),
    date_reservation TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_expiration  DATE        NOT NULL,
    statut           VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    position         INTEGER     NOT NULL DEFAULT 1,
    notifie          BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS notifications (
    id             BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT      NOT NULL REFERENCES utilisateurs(id),
    type           VARCHAR(40) NOT NULL,
    message        TEXT        NOT NULL,
    date_envoi     TIMESTAMP   NOT NULL DEFAULT NOW(),
    lu             BOOLEAN     NOT NULL DEFAULT FALSE,
    canal          VARCHAR(20) NOT NULL DEFAULT 'INTERNE'
);

CREATE TABLE IF NOT EXISTS mouvements_livre (
    id            BIGSERIAL PRIMARY KEY,
    exemplaire_id BIGINT      NOT NULL REFERENCES exemplaires(id),
    type          VARCHAR(20) NOT NULL,
    date_heure    TIMESTAMP   NOT NULL DEFAULT NOW(),
    notes         TEXT
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_emprunts_utilisateur ON emprunts(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_emprunts_statut ON emprunts(statut);
CREATE INDEX IF NOT EXISTS idx_emprunts_date ON emprunts(date_emprunt);
CREATE INDEX IF NOT EXISTS idx_reservations_utilisateur ON reservations(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_reservations_livre ON reservations(livre_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);
CREATE INDEX IF NOT EXISTS idx_exemplaires_livre ON exemplaires(livre_id);
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_livres_categorie ON livres(categorie_id);
CREATE INDEX IF NOT EXISTS idx_livres_isbn ON livres(isbn);
