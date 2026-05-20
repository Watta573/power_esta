-- Script SQL corrigé pour les permissions
-- Remplacer les apostrophes échappées par des guillemets doubles ou doubler les apostrophes

INSERT INTO permissions (code, nom, description) VALUES
('ADMIN_AUDIT_VIEW', 'Voir les logs d''audit', 'Consulter les journaux d''audit du système'),
('ACQUISITIONS_SUGGEST', 'Suggérer acquisition', 'Proposer l''achat de nouveaux ouvrages'),
('ACQUISITIONS_APPROVE', 'Approuver suggestion', 'Valider ou rejeter les suggestions d''achat'),
('ACQUISITIONS_ORDERS_VIEW', 'Voir commandes', 'Consulter les commandes d''achat'),
('ACQUISITIONS_ORDERS_CREATE', 'Créer commande', 'Passer de nouvelles commandes'),
('ACQUISITIONS_DELIVERY', 'Marquer livraison', 'Confirmer la réception des commandes'),
('ACQUISITIONS_ORDERS_CANCEL', 'Annuler commande', 'Annuler une commande en cours'),
('ACQUISITIONS_BUDGET', 'Voir budget', 'Consulter les statistiques budgétaires');