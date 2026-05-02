-- V7__notif_preferences.sql
-- Colonnes préférences notifications email utilisateurs

ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS notif_email_emprunt          BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_email_retour            BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_email_reservation       BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_email_livre_disponible  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notif_email_nouveau_livre     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notif_email_rappel_retour     BOOLEAN NOT NULL DEFAULT TRUE;
