-- V16__add_bloque_pour_reservation_to_exemplaires.sql
-- Ajoute la colonne de blocage des exemplaires réservés afin que les exemplaires réservés ne soient pas proposés pour un emprunt général.

ALTER TABLE exemplaires
    ADD COLUMN IF NOT EXISTS bloque_pour_reservation BOOLEAN NOT NULL DEFAULT FALSE;
