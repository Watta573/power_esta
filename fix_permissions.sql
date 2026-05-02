-- Vérification et correction des permissions pour les bibliothécaires

-- 1. Vérifier les utilisateurs bibliothécaires
SELECT id, nom, prenom, email, role, actif 
FROM utilisateurs 
WHERE role = 'BIBLIOTHECAIRE';

-- 2. Vérifier les permissions existantes pour les bibliothécaires
SELECT u.nom, u.prenom, u.role, p.code as permission_code, up.accorde
FROM utilisateurs u
LEFT JOIN utilisateur_permissions up ON u.id = up.utilisateur_id
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.role = 'BIBLIOTHECAIRE'
ORDER BY u.nom, p.code;

-- 3. Vérifier si les permissions ACQUISITIONS existent
SELECT * FROM permissions WHERE code LIKE 'ACQUISITIONS%';

-- 4. Si aucune permission n'est trouvée, créer un utilisateur bibliothécaire de test
INSERT INTO utilisateurs (nom, prenom, email, identifiant, mot_de_passe, role, actif, date_inscription)
SELECT 'Test', 'Bibliothécaire', 'biblio@test.com', 'BIBLIO001', 
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
       'BIBLIOTHECAIRE', true, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM utilisateurs WHERE email = 'biblio@test.com'
);

-- 5. Forcer l'attribution des permissions par défaut pour tous les bibliothécaires
-- (Le système devrait les donner automatiquement via le service, mais on peut les ajouter manuellement)

-- Créer les permissions ACQUISITIONS si elles n'existent pas
INSERT INTO permissions (code, nom, description, module, actif) VALUES
('ACQUISITIONS_VIEW', 'Voir les acquisitions', 'Permet de consulter les acquisitions', 'ACQUISITIONS', true),
('ACQUISITIONS_SUGGEST', 'Suggérer des acquisitions', 'Permet de suggérer des livres à acquérir', 'ACQUISITIONS', true),
('ACQUISITIONS_ORDERS_VIEW', 'Voir les commandes', 'Permet de consulter les commandes d''achat', 'ACQUISITIONS', true),
('ACQUISITIONS_ORDERS_CREATE', 'Créer des commandes', 'Permet de créer des commandes d''achat', 'ACQUISITIONS', true),
('ACQUISITIONS_APPROVE', 'Approuver les suggestions', 'Permet d''approuver ou rejeter les suggestions', 'ACQUISITIONS', true),
('ACQUISITIONS_BUDGET', 'Voir le budget', 'Permet de consulter le budget des acquisitions', 'ACQUISITIONS', true)
ON CONFLICT (code) DO NOTHING;

-- Attribuer explicitement les permissions ACQUISITIONS aux bibliothécaires
INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, date_accord, notes)
SELECT u.id, p.id, true, NOW(), 'Attribution automatique pour bibliothécaire'
FROM utilisateurs u, permissions p
WHERE u.role = 'BIBLIOTHECAIRE' 
  AND p.code IN ('ACQUISITIONS_VIEW', 'ACQUISITIONS_SUGGEST', 'ACQUISITIONS_ORDERS_VIEW', 
                 'ACQUISITIONS_ORDERS_CREATE', 'ACQUISITIONS_APPROVE', 'ACQUISITIONS_BUDGET')
ON CONFLICT (utilisateur_id, permission_id) DO UPDATE SET
  accorde = true,
  date_accord = NOW(),
  notes = 'Correction automatique';

-- 6. Vérification finale
SELECT u.nom, u.prenom, u.role, 
       COUNT(CASE WHEN p.code LIKE 'ACQUISITIONS%' AND up.accorde = true THEN 1 END) as acquisitions_permissions
FROM utilisateurs u
LEFT JOIN utilisateur_permissions up ON u.id = up.utilisateur_id
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.role = 'BIBLIOTHECAIRE'
GROUP BY u.id, u.nom, u.prenom, u.role;