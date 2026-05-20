-- Script simple pour vérifier et corriger les permissions

-- 1. Vérifier les utilisateurs
SELECT 'UTILISATEURS' as type, id, nom, prenom, email, role, actif FROM utilisateurs WHERE role IN ('ADMIN', 'BIBLIOTHECAIRE');

-- 2. Vérifier les permissions existantes
SELECT 'PERMISSIONS' as type, id, code, nom, module, actif FROM permissions WHERE code LIKE 'ACQUISITIONS%' ORDER BY code;

-- 3. Créer les permissions manquantes
INSERT INTO permissions (code, nom, description, module, actif) VALUES
('ACQUISITIONS_VIEW', 'Voir les acquisitions', 'Permet de consulter les acquisitions', 'ACQUISITIONS', true),
('ACQUISITIONS_SUGGEST', 'Suggérer des acquisitions', 'Permet de suggérer des livres à acquérir', 'ACQUISITIONS', true),
('ACQUISITIONS_ORDERS_VIEW', 'Voir les commandes', 'Permet de consulter les commandes d''achat', 'ACQUISITIONS', true),
('ACQUISITIONS_ORDERS_CREATE', 'Créer des commandes', 'Permet de créer des commandes d''achat', 'ACQUISITIONS', true),
('ACQUISITIONS_APPROVE', 'Approuver les suggestions', 'Permet d''approuver ou rejeter les suggestions', 'ACQUISITIONS', true),
('ACQUISITIONS_BUDGET', 'Voir le budget', 'Permet de consulter le budget des acquisitions', 'ACQUISITIONS', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Créer un utilisateur bibliothécaire de test si nécessaire
INSERT INTO utilisateurs (nom, prenom, email, identifiant, mot_de_passe, role, actif, date_inscription)
VALUES ('Test', 'Bibliothécaire', 'biblio@test.com', 'BIBLIO001', 
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
        'BIBLIOTHECAIRE', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- 5. Vérification finale
SELECT 'VERIFICATION' as type, u.nom, u.prenom, u.role, u.email, u.actif
FROM utilisateurs u 
WHERE u.role = 'BIBLIOTHECAIRE';