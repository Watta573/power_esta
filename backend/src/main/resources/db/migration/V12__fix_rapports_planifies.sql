-- V12__fix_rapports_planifies.sql
-- Correction pour la table rapports_planifies

-- Vérifier si la table existe et la créer si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rapports_planifies') THEN
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
        
        -- Index pour les rapports planifiés
        CREATE INDEX idx_rapports_planifies_actif ON rapports_planifies(actif);
        CREATE INDEX idx_rapports_planifies_type ON rapports_planifies(type_rapport);
        CREATE INDEX idx_rapports_planifies_prochaine ON rapports_planifies(prochaine_execution);
        
        RAISE NOTICE 'Table rapports_planifies créée avec succès';
    ELSE
        RAISE NOTICE 'Table rapports_planifies existe déjà';
    END IF;
END $$;

-- Insérer les données par défaut seulement si la table est vide
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM rapports_planifies) = 0 THEN
        INSERT INTO rapports_planifies (nom, type_rapport, cron_expression, destinataires, parametres) VALUES
        ('Statistiques hebdomadaires', 'CIRCULATION', '0 9 * * 1', ARRAY['admin@biblioteca.local'], 
         '{"periode": "semaine", "inclure_graphiques": true}'::jsonb),
        ('Rapport mensuel de collection', 'COLLECTION', '0 9 1 * *', ARRAY['admin@biblioteca.local'], 
         '{"periode": "mois", "par_categorie": true}'::jsonb);
        
        RAISE NOTICE 'Données par défaut insérées dans rapports_planifies';
    ELSE
        RAISE NOTICE 'Des données existent déjà dans rapports_planifies';
    END IF;
END $$;

-- Vérifier et créer les autres tables si nécessaires
DO $$
BEGIN
    -- Vérifier templates_etiquettes
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'templates_etiquettes') THEN
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
        
        -- Template par défaut
        INSERT INTO templates_etiquettes (nom, type, template_html, template_css) VALUES
        ('Étiquette Livre Standard', 'LIVRE', 
         '<div class="etiquette"><div class="titre">{{titre}}</div><div class="auteur">{{auteur}}</div><div class="cote">{{cote}}</div><div class="code-barres">{{code_barres}}</div></div>',
         '.etiquette { font-family: Arial; font-size: 10px; padding: 2mm; } .titre { font-weight: bold; margin-bottom: 1mm; } .auteur { font-style: italic; margin-bottom: 1mm; } .cote { font-size: 12px; font-weight: bold; margin-bottom: 2mm; } .code-barres { font-family: monospace; font-size: 8px; }'
        );
        
        RAISE NOTICE 'Table templates_etiquettes créée';
    END IF;
    
    -- Vérifier codes_barres
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'codes_barres') THEN
        CREATE TABLE codes_barres (
            id BIGSERIAL PRIMARY KEY,
            objet_id BIGINT NOT NULL,
            objet_type VARCHAR(50) NOT NULL, -- LIVRE, UTILISATEUR, EXEMPLAIRE
            code VARCHAR(100) NOT NULL UNIQUE,
            type_code VARCHAR(20) DEFAULT 'CODE128', -- CODE128, EAN13, QR
            date_creation TIMESTAMP DEFAULT NOW(),
            actif BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX idx_codes_barres_objet ON codes_barres(objet_type, objet_id);
        CREATE INDEX idx_codes_barres_code ON codes_barres(code);
        
        RAISE NOTICE 'Table codes_barres créée';
    END IF;
    
    -- Vérifier statistiques_circulation
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'statistiques_circulation') THEN
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
        
        CREATE INDEX idx_stats_date ON statistiques_circulation(date_stat);
        
        RAISE NOTICE 'Table statistiques_circulation créée';
    END IF;
END $$;