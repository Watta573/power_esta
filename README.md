# Power Esta, SIGB (Système Intégré de Gestion de Bibliothèque).

Architecture et déploiement d'un écosystème numérique complexe dédié à la gestion de bibliothèque, optimisé par un stack Spring Boot / React et PostgreSQL. La solution intègre des fonctionnalités de notifications en temps réel et une gestion granulaire des accès adaptée à cinq profils d'utilisateurs distincts.


---

## Configuration du Projet (Étape par Étape)

### 1. Prérequis
Avant de commencer, assurez-vous d'avoir installé :
- **Java 17** ou supérieur
- **Node.js 18+** & npm
- **PostgreSQL** (installé et en cours d'exécution)
- **Maven** (optionnel, `mvnw` est fourni)

---

### 2. Configuration de la Base de Données

#### A. Création de la base
Ouvrez votre terminal SQL (psql) ou un outil comme pgAdmin et créez la base de données :
```sql
CREATE DATABASE power_esta;
```

#### B. Importation des données
Le projet utilise **Flyway** pour gérer les migrations, mais vous pouvez aussi importer les fichiers manuellement si Flyway est désactivé.

**Ordre d'importation recommandé (via psql) :**
```bash
# Core Schema
psql -U votre_user -d power_esta -f backend/src/main/resources/db/migration/V1__init_schema.sql
psql -U votre_user -d power_esta -f backend/src/main/resources/db/migration/V2__seed_data.sql

# Extensions et Corrections (Racine du projet)
psql -U votre_user -d power_esta -f tables_sigb_manquantes.sql
psql -U votre_user -d power_esta -f all_permissions_complete.sql
```

---

### 3. Configuration du Backend (Spring Boot)

1. Accédez au dossier `backend/` : `cd backend`
2. Configurez vos variables d'environnement dans le fichier `.env` :
   ```env
   DB_URL=jdbc:postgresql://localhost:5432/power_esta
   DB_USERNAME=votre_utilisateur_postgres
   DB_PASSWORD=votre_mot_de_passe
   JWT_SECRET=UneCleTresLongueEtSecreteDeMinimum32Caracteres
   
   # Configuration Mail (Facultatif)
   MAIL_USERNAME=votre_email@gmail.com
   MAIL_PASSWORD=votre_mot_de_passe_application
   ```
3. Lancer le serveur :
   ```bash
   ./mvnw spring-boot:run
   ```
   *Le serveur sera accessible sur : `http://localhost:8080`*

---

### 4. Configuration du Frontend (React)

1. Accédez au dossier `bibliotheque-app/` : `cd bibliotheque-app`
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez l'application :
   ```bash
   npm run dev
   ```
   *L'application sera accessible sur : `http://localhost:5173`*

---

## Structure du Projet

- `/backend` : API REST Spring Boot (Java).
- `/bibliotheque-app` : Interface utilisateur React + Vite + Tailwind CSS.
- `/*.sql` : Scripts de maintenance et d'initialisation de la base de données.

## Identifiants par défaut (Seed Data)
- **Admin** : `admin` / `admin123` (à vérifier dans V2__seed_data.sql)
- **Email de test** : `admin@esta.bf`

---

## Maintenance
Si vous rencontrez des problèmes de permissions ou de schéma :
1. Utilisez `fix_sql_syntax.sql` pour corriger les erreurs de syntaxe.
2. Utilisez `all_permissions_complete.sql` pour réinitialiser les droits d'accès.

---

## Déploiement

Ce dépôt contient deux parties déployables : le frontend (`bibliotheque-app`) et le backend (`backend`). Des workflows GitHub Actions sont fournis pour automatiser la construction et le déploiement.

- Frontend : publication sur GitHub Pages (branche `gh-pages`) via `.github/workflows/deploy-frontend.yml`.
- Backend : build Maven + image Docker poussée sur GitHub Container Registry (ghcr.io) via `.github/workflows/backend-docker.yml`.

Étapes rapides pour publier le projet sur GitHub (à lancer depuis la racine du projet) :

```bash
# initialiser le dépôt local (si nécessaire)
git init
git add .
git commit -m "Add GitHub Actions workflows and deployment docs"
git branch -M main
git remote add origin https://github.com/Watta573/power_esta.git
git push -u origin main
```

Notes et vérifications post-push :

- GitHub Pages : allez dans les paramètres du dépôt → Pages, configurez la source sur la branche `gh-pages` (le workflow créera/publiera cette branche automatiquement après le build du frontend).
- GHCR (GitHub Container Registry) : le workflow utilise `GITHUB_TOKEN` pour se connecter à `ghcr.io`. Assurez-vous que l'action a la permission `packages: write` (définie dans le workflow). Si vous préférez utiliser un PAT, créez un secret `CR_PAT` et remplacez `secrets.GITHUB_TOKEN` par `secrets.CR_PAT` dans le workflow.

Si vous voulez que je :

- crée une release automatique, je peux ajouter un workflow `release`.
- configure un domaine personnalisé pour GitHub Pages, dites-moi le domaine et je gère la config.

