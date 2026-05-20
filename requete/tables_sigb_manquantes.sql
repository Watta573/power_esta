-- Tables Critiques Manquantes pour SIGB Professionnel

-- ===== GESTION BIBLIOGRAPHIQUE AVANCÉE =====
CREATE TABLE notices_bibliographiques (
    id BIGSERIAL PRIMARY KEY,
    titre_uniforme VARCHAR(500),
    vedette_auteur VARCHAR(300),
    vedette_matiere TEXT[],
    classification_dewey VARCHAR(20),
    classification_cdu VARCHAR(20),
    notice_marc21 TEXT,
    notice_unimarc TEXT,
    isbn_multiples VARCHAR(500)[],
    issn VARCHAR(20),
    doi VARCHAR(100),
    oclc_number VARCHAR(50),
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

CREATE TABLE autorites (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50), -- AUTEUR, SUJET, COLLECTIVITE, LIEU
    forme_retenue VARCHAR(500),
    formes_rejetees TEXT[],
    notice_autorite TEXT,
    source_autorite VARCHAR(100), -- BNF, SUDOC, LCNAF
    identifiant_externe VARCHAR(100),
    date_creation TIMESTAMP DEFAULT NOW()
);

-- ===== RÈGLES DE CIRCULATION =====
CREATE TABLE regles_circulation (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200),
    type_utilisateur VARCHAR(50),
    type_document VARCHAR(50),
    duree_pret_jours INTEGER,
    nb_renouvellements_max INTEGER,
    nb_emprunts_max INTEGER,
    amende_par_jour DECIMAL(10,2),
    amende_max DECIMAL(10,2),
    actif BOOLEAN DEFAULT TRUE,
    date_debut DATE,
    date_fin DATE
);

-- ===== WORKFLOWS =====
CREATE TABLE workflows (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200),
    module VARCHAR(50), -- ACQUISITION, CATALOGAGE, CIRCULATION
    description TEXT,
    etapes JSONB, -- Configuration des étapes
    conditions JSONB, -- Conditions de passage
    actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE workflow_instances (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT REFERENCES workflows(id),
    objet_id BIGINT,
    objet_type VARCHAR(50), -- LIVRE, COMMANDE, SUGGESTION
    etape_courante INTEGER,
    statut VARCHAR(50),
    donnees JSONB,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

-- ===== CALENDRIER ET HORAIRES =====
CREATE TABLE calendrier_bibliotheque (
    id BIGSERIAL PRIMARY KEY,
    date_fermeture DATE,
    type_fermeture VARCHAR(50), -- FERIE, CONGE, MAINTENANCE
    description VARCHAR(500),
    recurrent BOOLEAN DEFAULT FALSE,
    recurrence_config JSONB
);

CREATE TABLE horaires_ouverture (
    id BIGSERIAL PRIMARY KEY,
    jour_semaine INTEGER, -- 1=Lundi, 7=Dimanche
    heure_ouverture TIME,
    heure_fermeture TIME,
    actif BOOLEAN DEFAULT TRUE,
    date_debut DATE,
    date_fin DATE
);

-- ===== ÉTIQUETTES ET CODES-BARRES =====
CREATE TABLE templates_etiquettes (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100),
    type VARCHAR(50), -- LIVRE, UTILISATEUR, RAYONNAGE
    format VARCHAR(50), -- A4, Letter, Custom
    largeur_mm INTEGER,
    hauteur_mm INTEGER,
    template_html TEXT,
    template_css TEXT,
    actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE codes_barres (
    id BIGSERIAL PRIMARY KEY,
    objet_id BIGINT,
    objet_type VARCHAR(50),
    code VARCHAR(100) UNIQUE,
    type_code VARCHAR(20), -- CODE128, EAN13, QR
    date_creation TIMESTAMP DEFAULT NOW(),
    actif BOOLEAN DEFAULT TRUE
);

-- ===== STATISTIQUES ET RAPPORTS =====
CREATE TABLE statistiques_circulation (
    id BIGSERIAL PRIMARY KEY,
    date_stat DATE,
    nb_emprunts INTEGER DEFAULT 0,
    nb_retours INTEGER DEFAULT 0,
    nb_reservations INTEGER DEFAULT 0,
    nb_nouveaux_lecteurs INTEGER DEFAULT 0,
    nb_amendes DECIMAL(10,2) DEFAULT 0,
    donnees_detaillees JSONB
);

CREATE TABLE rapports_planifies (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200),
    type_rapport VARCHAR(100),
    parametres JSONB,
    cron_expression VARCHAR(100),
    destinataires TEXT[],
    format_sortie VARCHAR(20), -- PDF, EXCEL, CSV
    actif BOOLEAN DEFAULT TRUE,
    derniere_execution TIMESTAMP
);

-- ===== INTÉGRATIONS EXTERNES =====
CREATE TABLE integrations_externes (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100),
    type VARCHAR(50), -- SISCOL, SIGB, CATALOGUE
    url_api VARCHAR(500),
    authentification JSONB,
    configuration JSONB,
    actif BOOLEAN DEFAULT TRUE,
    derniere_sync TIMESTAMP
);

CREATE TABLE logs_synchronisation (
    id BIGSERIAL PRIMARY KEY,
    integration_id BIGINT REFERENCES integrations_externes(id),
    type_operation VARCHAR(50),
    nb_enregistrements INTEGER,
    nb_succes INTEGER,
    nb_erreurs INTEGER,
    details_erreurs TEXT,
    date_sync TIMESTAMP DEFAULT NOW()
);

-- ===== COLLECTIONS ET POLITIQUES =====
CREATE TABLE politiques_collection (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(200),
    categorie_id BIGINT REFERENCES categories(id),
    budget_annuel DECIMAL(12,2),
    objectif_croissance DECIMAL(5,2),
    criteres_selection TEXT,
    criteres_desherbage TEXT,
    responsable_id BIGINT REFERENCES utilisateurs(id)
);

CREATE TABLE analyses_collection (
    id BIGSERIAL PRIMARY KEY,
    date_analyse DATE,
    categorie_id BIGINT REFERENCES categories(id),
    nb_titres INTEGER,
    nb_exemplaires INTEGER,
    age_moyen_annees DECIMAL(5,2),
    taux_rotation DECIMAL(5,2),
    lacunes_identifiees TEXT,
    recommandations TEXT
);

-- ===== ÉVÉNEMENTS ET ANIMATIONS =====
CREATE TABLE evenements (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(300),
    description TEXT,
    type_evenement VARCHAR(50), -- CONFERENCE, ATELIER, EXPOSITION
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    lieu VARCHAR(200),
    nb_places_max INTEGER,
    nb_inscrits INTEGER DEFAULT 0,
    public_cible VARCHAR(100),
    animateur VARCHAR(200),
    statut VARCHAR(50) DEFAULT 'PLANIFIE'
);

CREATE TABLE inscriptions_evenements (
    id BIGSERIAL PRIMARY KEY,
    evenement_id BIGINT REFERENCES evenements(id),
    utilisateur_id BIGINT REFERENCES utilisateurs(id),
    date_inscription TIMESTAMP DEFAULT NOW(),
    statut VARCHAR(50) DEFAULT 'INSCRIT',
    commentaires TEXT
);

-- ===== INDEX POUR PERFORMANCES =====
CREATE INDEX idx_notices_isbn ON notices_bibliographiques USING GIN (isbn_multiples);
CREATE INDEX idx_autorites_type ON autorites(type);
CREATE INDEX idx_workflows_module ON workflows(module);
CREATE INDEX idx_stats_date ON statistiques_circulation(date_stat);
CREATE INDEX idx_codes_barres_objet ON codes_barres(objet_type, objet_id);
CREATE INDEX idx_evenements_dates ON evenements(date_debut, date_fin);