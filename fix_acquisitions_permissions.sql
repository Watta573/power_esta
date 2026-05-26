-- Ajoute ACQUISITIONS_VIEW et ACQUISITIONS_SUGGEST aux rôles PUBLIC et ETUDIANT
-- pour permettre la soumission de suggestions d'achat depuis l'espace membre

INSERT INTO utilisateur_permissions (utilisateur_id, permission_id, accorde, notes)
SELECT u.id, p.id, true, 'Fix suggestions achat - membres'
FROM utilisateurs u, permissions p
WHERE u.role IN ('PUBLIC', 'ETUDIANT')
  AND p.code IN ('ACQUISITIONS_VIEW', 'ACQUISITIONS_SUGGEST')
ON CONFLICT (utilisateur_id, permission_id) DO NOTHING;
