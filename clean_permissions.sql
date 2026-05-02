-- Option 1: Supprimer toutes les permissions existantes et les recréer
DELETE FROM permissions;

-- Option 2: Ou supprimer seulement les permissions en conflit
-- DELETE FROM permissions WHERE code IN ('EMPRUNTS_VIEW', 'ACQUISITIONS_SUGGEST', 'ACQUISITIONS_APPROVE', 'ACQUISITIONS_ORDERS_VIEW', 'ACQUISITIONS_ORDERS_CREATE', 'ACQUISITIONS_DELIVERY', 'ACQUISITIONS_ORDERS_CANCEL', 'ACQUISITIONS_BUDGET');

-- Puis exécuter le script permissions_corrected.sql