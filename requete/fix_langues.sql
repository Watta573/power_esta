-- Création de la table langues si elle n'existe pas
CREATE TABLE IF NOT EXISTS langues (
    id  BIGSERIAL PRIMARY KEY,
    nom VARCHAR(80) NOT NULL UNIQUE
);

-- Données de base
INSERT INTO langues (nom) VALUES
    ('Français'),
    ('Anglais'),
    ('Arabe'),
    ('Espagnol'),
    ('Allemand'),
    ('Portugais')
ON CONFLICT (nom) DO NOTHING;

-- Table de liaison livre_langues
CREATE TABLE IF NOT EXISTS livre_langues (
    livre_id  BIGINT NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
    langue_id BIGINT NOT NULL REFERENCES langues(id) ON DELETE CASCADE,
    PRIMARY KEY (livre_id, langue_id)
);

-- Migration : copier l'ancienne colonne langue vers la nouvelle table
-- (uniquement pour les livres qui ont une langue renseignée et pas encore migrés)
INSERT INTO livre_langues (livre_id, langue_id)
SELECT l.id, lg.id
FROM livres l
JOIN langues lg ON lg.nom = l.langue
WHERE l.langue IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM livre_langues ll WHERE ll.livre_id = l.id
  );
