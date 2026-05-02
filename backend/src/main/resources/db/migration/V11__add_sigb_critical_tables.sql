-- V11__add_sigb_critical_tables.sql
-- Ajout des tables critiques pour un SIGB professionnel

-- ===== RÈGLES DE CIRCULATION =====
CREATE TABLE regles_circulation (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type_utilisateur VARCHAR(50) NOT NULL, -- ETUDIANT, ENSEIGNANT, PUBLIC
    type_document VARCHAR(50) DEFAULT 'LIVRE', -- LIVRE, PERIODIQUE, DVD
    duree_pret_jours INTEGER NOT NULL DEFAULT 14,
    nb_renouvellements_max INTEGER DEFAULT 2,
    nb_emprunts_max INTEGER DEFAULT 5,
    amende_par_jour DECIMAL(10,2) DEFAULT 0.50,
    amende_max DECIMAL(10,2) DEFAULT 50.00,
    actif BOOLEAN DEFAULT TRUE,
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

-- ===== CALENDRIER BIBLIOTHÈQUE =====
CREATE TABLE calendrier_bibliotheque (
    id BIGSERIAL PRIMARY KEY,
    date_fermeture DATE NOT NULL,
    type_fermeture VARCHAR(50) NOT NULL, -- FERIE, CONGE, MAINTENANCE, FORMATION
    description VARCHAR(500),
    recurrent BOOLEAN DEFAULT FALSE,
    recurrence_config JSONB, -- Pour les fermetures récurrentes
    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE TABLE horaires_ouverture (
    id BIGSERIAL PRIMARY KEY,
    jour_semaine INTEGER NOT NULL CHECK (jour_semaine BETWEEN 1 AND 7), -- 1=Lundi, 7=Dimanche
    heure_ouverture TIME NOT NULL,
    heure_fermeture TIME NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- ===== CODES-BARRES ET ÉTIQUETTES =====
CREATE TABLE codes_barres (
    id BIGSERIAL PRIMARY KEY,
    objet_id BIGINT NOT NULL,
    objet_type VARCHAR(50) NOT NULL, -- LIVRE, UTILISATEUR, EXEMPLAIRE
    code VARCHAR(100) NOT NULL UNIQUE,
    type_code VARCHAR(20) DEFAULT 'CODE128', -- CODE128, EAN13, QR
    date_creation TIMESTAMP DEFAULT NOW(),
    actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE templates_etiquettes (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- LIVRE, UTILISATEUR, RAYONNAGE
    format VARCHAR(50) DEFAULT 'A4', -- A4, Letter, Custom
    largeur_mm INTEGER DEFAULT 70,
    hauteur_mm INTEGER DEFAULT 37,
    template_html TEXT NOT NULL,
    template_css TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- ===== STATISTIQUES =====
CREATE TABLE statistiques_circulation (
    id BIGSERIAL PRIMARY KEY,
    date_stat DATE NOT NULL,
    nb_emprunts INTEGER DEFAULT 0,
    nb_retours INTEGER DEFAULT 0,
    nb_reservations INTEGER DEFAULT 0,
    nb_nouveaux_lecteurs INTEGER DEFAULT 0,
    montant_amendes DECIMAL(10,2) DEFAULT 0,
    donnees_detaillees JSONB,
    date_creation TIMESTAMP DEFAULT NOW(),
    UNIQUE(date_stat)
);

-- ===== ÉVÉNEMENTS =====
CREATE TABLE evenements (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(300) NOT NULL,
    description TEXT,
    type_evenement VARCHAR(50) DEFAULT 'CONFERENCE', -- CONFERENCE, ATELIER, EXPOSITION, FORMATION
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    lieu VARCHAR(200),
    nb_places_max INTEGER,
    nb_inscrits INTEGER DEFAULT 0,
    public_cible VARCHAR(100), -- TOUT_PUBLIC, ETUDIANTS, ENSEIGNANTS
    animateur VARCHAR(200),
    statut VARCHAR(50) DEFAULT 'PLANIFIE', -- PLANIFIE, EN_COURS, TERMINE, ANNULE
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inscriptions_evenements (
    id BIGSERIAL PRIMARY KEY,
    evenement_id BIGINT NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    date_inscription TIMESTAMP DEFAULT NOW(),
    statut VARCHAR(50) DEFAULT 'INSCRIT', -- INSCRIT, PRESENT, ABSENT, ANNULE
    commentaires TEXT,
    UNIQUE(evenement_id, utilisateur_id)
);

-- ===== RAPPORTS PLANIFIÉS =====
CREATE TABLE rapports_planifies (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type_rapport VARCHAR(100) NOT NULL, -- CIRCULATION, FINANCES, COLLECTION
    parametres JSONB,
    cron_expression VARCHAR(100), -- Expression cron pour planification
    destinataires TEXT[], -- Emails des destinataires
    format_sortie VARCHAR(20) DEFAULT 'PDF', -- PDF, EXCEL, CSV
    actif BOOLEAN DEFAULT TRUE,
    derniere_execution TIMESTAMP,
    prochaine_execution TIMESTAMP,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- ===== WORKFLOWS =====
CREATE TABLE workflows (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    module VARCHAR(50) NOT NULL, -- ACQUISITION, CATALOGAGE, CIRCULATION
    etapes JSONB NOT NULL, -- Configuration des étapes
    conditions JSONB, -- Conditions de passage entre étapes
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_instances (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL REFERENCES workflows(id),
    objet_id BIGINT NOT NULL,
    objet_type VARCHAR(50) NOT NULL, -- LIVRE, COMMANDE, SUGGESTION
    etape_courante INTEGER DEFAULT 1,
    statut VARCHAR(50) DEFAULT 'EN_COURS', -- EN_COURS, TERMINE, SUSPENDU, ANNULE
    donnees JSONB,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCES =====
CREATE INDEX idx_regles_circulation_type_user ON regles_circulation(type_utilisateur);
CREATE INDEX idx_regles_circulation_type_doc ON regles_circulation(type_document);
CREATE INDEX idx_calendrier_date ON calendrier_bibliotheque(date_fermeture);
CREATE INDEX idx_horaires_jour ON horaires_ouverture(jour_semaine);
CREATE INDEX idx_codes_barres_objet ON codes_barres(objet_type, objet_id);
CREATE INDEX idx_codes_barres_code ON codes_barres(code);
CREATE INDEX idx_stats_date ON statistiques_circulation(date_stat);
CREATE INDEX idx_evenements_dates ON evenements(date_debut, date_fin);
CREATE INDEX idx_evenements_type ON evenements(type_evenement);
CREATE INDEX idx_workflows_module ON workflows(module);
CREATE INDEX idx_workflow_instances_objet ON workflow_instances(objet_type, objet_id);

-- ===== DONNÉES INITIALES =====

-- Règles de circulation par défaut
INSERT INTO regles_circulation (nom, type_utilisateur, type_document, duree_pret_jours, nb_renouvellements_max, nb_emprunts_max, amende_par_jour, amende_max) VALUES
('Étudiant - Livre standard', 'ETUDIANT', 'LIVRE', 14, 2, 5, 0.50, 30.00),
('Enseignant - Livre standard', 'ENSEIGNANT', 'LIVRE', 30, 3, 10, 0.30, 50.00),
('Public - Livre standard', 'PUBLIC', 'LIVRE', 7, 1, 3, 1.00, 20.00),
('Étudiant - Périodique', 'ETUDIANT', 'PERIODIQUE', 3, 0, 2, 1.00, 15.00),
('Enseignant - Périodique', 'ENSEIGNANT', 'PERIODIQUE', 7, 1, 5, 0.50, 25.00);

-- Horaires d'ouverture par défaut
INSERT INTO horaires_ouverture (jour_semaine, heure_ouverture, heure_fermeture) VALUES
(1, '08:00', '18:00'), -- Lundi
(2, '08:00', '18:00'), -- Mardi
(3, '08:00', '18:00'), -- Mercredi
(4, '08:00', '18:00'), -- Jeudi
(5, '08:00', '17:00'), -- Vendredi
(6, '09:00', '12:00'); -- Samedi
-- Dimanche fermé

-- Template d'étiquette par défaut pour les livres
INSERT INTO templates_etiquettes (nom, type, template_html, template_css) VALUES
('Étiquette Livre Standard', 'LIVRE', 
'<div class="etiquette">
  <div class="titre">{{titre}}</div>
  <div class="auteur">{{auteur}}</div>
  <div class="cote">{{cote}}</div>
  <div class="code-barres">{{code_barres}}</div>
</div>',
'.etiquette { font-family: Arial; font-size: 10px; padding: 2mm; }
.titre { font-weight: bold; margin-bottom: 1mm; }
.auteur { font-style: italic; margin-bottom: 1mm; }
.cote { font-size: 12px; font-weight: bold; margin-bottom: 2mm; }
.code-barres { font-family: monospace; font-size: 8px; }'
);

-- Workflow d'acquisition par défaut
INSERT INTO workflows (nom, module, etapes) VALUES
('Acquisition Standard', 'ACQUISITION', 
'[
  {"id": 1, "nom": "Suggestion", "description": "Suggestion d''achat soumise"},
  {"id": 2, "nom": "Évaluation", "description": "Évaluation par le bibliothécaire"},
  {"id": 3, "nom": "Approbation", "description": "Approbation budgétaire"},
  {"id": 4, "nom": "Commande", "description": "Commande passée au fournisseur"},
  {"id": 5, "nom": "Réception", "description": "Réception et catalogage"},
  {"id": 6, "nom": "Mise en service", "description": "Mise à disposition du public"}
]'::jsonb);

-- Rapport planifié par défaut
INSERT INTO rapports_planifies (nom, type_rapport, cron_expression, destinataires, parametres) VALUES
('Statistiques hebdomadaires', 'CIRCULATION', '0 9 * * 1', ARRAY['admin@biblioteca.local'], 
'{"periode": "semaine", "inclure_graphiques": true}'::jsonb),
('Rapport mensuel de collection', 'COLLECTION', '0 9 1 * *', ARRAY['admin@biblioteca.local'], 
'{"periode": "mois", "par_categorie": true}'::jsonb);