-- V17__periodique_numero_status_et_alma.sql
-- Ajoute le statut des numéros de périodiques, le suivi de réception et les champs de licence pour les périodiques électroniques.

ALTER TABLE periodiques
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'PHYSIQUE',
    ADD COLUMN IF NOT EXISTS acces_numerique VARCHAR(255),
    ADD COLUMN IF NOT EXISTS licence_acces VARCHAR(255);

ALTER TABLE numeros_periodique
    ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'ATTENDU',
    ADD COLUMN IF NOT EXISTS date_reception DATE;
