-- V3__audit_logs.sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT,
    email          VARCHAR(180),
    role           VARCHAR(30),
    action         VARCHAR(60)  NOT NULL,
    details        VARCHAR(255),
    ip_address     VARCHAR(60),
    date_action    TIMESTAMP    NOT NULL DEFAULT NOW(),
    statut         VARCHAR(10)  NOT NULL DEFAULT 'SUCCESS'
);

CREATE INDEX IF NOT EXISTS idx_audit_utilisateur ON audit_logs(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(date_action);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
