-- V4__acquisitions.sql

CREATE TABLE IF NOT EXISTS suggestions_achat (
    id             BIGSERIAL PRIMARY KEY,
    titre          VARCHAR(255) NOT NULL,
    auteur         VARCHAR(180),
    isbn           VARCHAR(20),
    demandeur_id   BIGINT REFERENCES utilisateurs(id),
    justification  TEXT,
    statut         VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    date_demande   TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_traitement TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commandes_achat (
    id             BIGSERIAL PRIMARY KEY,
    fournisseur    VARCHAR(180) NOT NULL,
    nb_titres      INTEGER      NOT NULL DEFAULT 0,
    montant        NUMERIC(12,2) NOT NULL DEFAULT 0,
    date_commande  DATE         NOT NULL DEFAULT CURRENT_DATE,
    date_livraison DATE,
    statut         VARCHAR(20)  NOT NULL DEFAULT 'EN_COURS',
    notes          TEXT
);

CREATE INDEX IF NOT EXISTS idx_suggestions_demandeur ON suggestions_achat(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_statut ON suggestions_achat(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes_achat(statut);
