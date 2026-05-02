-- V5__auth_security.sql
-- Colonnes pour : vérification email, refresh token, 2FA, limitation tentatives

ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS email_verifie        BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS token_verification   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS refresh_token        VARCHAR(512),
    ADD COLUMN IF NOT EXISTS refresh_token_expiry TIMESTAMP,
    ADD COLUMN IF NOT EXISTS totp_secret          VARCHAR(64),
    ADD COLUMN IF NOT EXISTS totp_actif           BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS login_attempts       INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until         TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_utilisateurs_token_verif ON utilisateurs(token_verification);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_refresh     ON utilisateurs(refresh_token);
