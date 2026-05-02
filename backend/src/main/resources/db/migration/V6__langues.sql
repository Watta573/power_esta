-- V6__langues.sql
CREATE TABLE IF NOT EXISTS langues (
    id    BIGSERIAL PRIMARY KEY,
    nom   VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO langues (nom) VALUES
    ('Français'),
    ('Anglais'),
    ('Arabe'),
    ('Espagnol'),
    ('Portugais'),
    ('Allemand'),
    ('Chinois'),
    ('Japonais'),
    ('Russe'),
    ('Italien')
ON CONFLICT (nom) DO NOTHING;
