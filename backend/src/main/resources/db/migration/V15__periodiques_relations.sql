-- V15__periodiques_relations.sql
-- Abonnements périodiques (lien Périodique <-> Fournisseur + coût)
CREATE TABLE abonnements_periodiques (
    id BIGSERIAL PRIMARY KEY,
    periodique_id BIGINT NOT NULL REFERENCES periodiques(id) ON DELETE CASCADE,
    fournisseur_id BIGINT NOT NULL REFERENCES fournisseurs(id),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    montant DECIMAL(12,2) NOT NULL DEFAULT 0,
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF', -- ACTIF, EXPIRE, ANNULE
    notes TEXT,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Emprunts de numéros de périodiques
CREATE TABLE emprunts_periodiques (
    id BIGSERIAL PRIMARY KEY,
    numero_id BIGINT NOT NULL REFERENCES numeros_periodique(id),
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id),
    date_emprunt DATE NOT NULL DEFAULT CURRENT_DATE,
    date_retour_prevue DATE NOT NULL,
    date_retour_effective DATE,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS', -- EN_COURS, RETOURNE, EN_RETARD
    amende DECIMAL(12,2) NOT NULL DEFAULT 0,
    amende_payee BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Réservations de numéros de périodiques
CREATE TABLE reservations_periodiques (
    id BIGSERIAL PRIMARY KEY,
    numero_id BIGINT NOT NULL REFERENCES numeros_periodique(id),
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id),
    date_reservation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_expiration DATE NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, DISPONIBLE, CONFIRMEE, ANNULEE
    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_abonnements_periodique ON abonnements_periodiques(periodique_id);
CREATE INDEX idx_abonnements_fournisseur ON abonnements_periodiques(fournisseur_id);
CREATE INDEX idx_emprunts_perio_numero ON emprunts_periodiques(numero_id);
CREATE INDEX idx_emprunts_perio_user ON emprunts_periodiques(utilisateur_id);
CREATE INDEX idx_emprunts_perio_statut ON emprunts_periodiques(statut);
CREATE INDEX idx_reservations_perio_numero ON reservations_periodiques(numero_id);
CREATE INDEX idx_reservations_perio_user ON reservations_periodiques(utilisateur_id);
