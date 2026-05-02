-- V2__seed_data.sql
-- Données initiales

INSERT INTO categories (nom, description, couleur) VALUES
    ('Informatique',    'Livres de programmation et systèmes',    '#3B82F6'),
    ('Mathématiques',   'Algèbre, analyse, probabilités',         '#8B5CF6'),
    ('Physique',        'Mécanique, thermodynamique, optique',    '#EF4444'),
    ('Littérature',     'Romans, poésie, essais',                 '#10B981'),
    ('Histoire',        'Histoire mondiale et régionale',         '#F59E0B'),
    ('Droit',           'Droit civil, pénal, international',      '#6366F1'),
    ('Économie',        'Microéconomie, macroéconomie, finance',  '#EC4899'),
    ('Médecine',        'Anatomie, pharmacologie, clinique',      '#14B8A6')
ON CONFLICT (nom) DO NOTHING;

-- Administrateur par défaut (mot de passe: Admin@2025 — BCrypt)
INSERT INTO utilisateurs (nom, prenom, identifiant, email, password, role, actif)
VALUES (
    'Administrateur', 'Système', 'admin',
    'admin@biblioteca.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
    'ADMIN', TRUE
) ON CONFLICT (email) DO NOTHING;
