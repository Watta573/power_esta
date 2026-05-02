# Intégration de l'authentification - Bibliothèque App

## ✅ Fonctionnalités implémentées

### 1. **Inscription (RegisterPage.tsx)**
- Formulaire complet avec validation Zod
- Champs : nom, prénom, email, téléphone, identifiant, rôle, mot de passe
- Validation du mot de passe (min 6 caractères, majuscule, chiffre)
- Indicateurs visuels de force du mot de passe
- Connexion à l'API : `POST /auth/register`
- Redirection vers `/login` après succès

### 2. **Connexion (LoginPage.tsx)**
- Formulaire avec email et mot de passe
- Validation des champs
- Affichage/masquage du mot de passe
- Connexion à l'API : `POST /auth/login`
- Stockage du token et utilisateur dans Zustand (persisté)
- Redirection vers `/dashboard` après succès
- Gestion des erreurs d'authentification

### 3. **Mot de passe oublié (ForgotPasswordPage.tsx)**
- Formulaire avec email uniquement
- Connexion à l'API : `POST /auth/forgot-password`
- Écran de confirmation après envoi
- Message de sécurité (ne révèle pas si l'email existe)

### 4. **Réinitialisation de mot de passe (ResetPasswordPage.tsx)**
- Récupération du token depuis l'URL (`?token=...`)
- Validation du token
- Formulaire avec nouveau mot de passe + confirmation
- Indicateurs de force du mot de passe
- Connexion à l'API : `POST /auth/reset-password`
- Écran de succès avec redirection vers `/login`
- Gestion des tokens invalides/expirés

### 5. **Changement de mot de passe (ChangePasswordPage.tsx)** ⭐ NOUVEAU
- Pour les utilisateurs connectés
- Champs : ancien mot de passe, nouveau mot de passe, confirmation
- Validation complète avec indicateurs visuels
- Connexion à l'API : `POST /auth/change-password`
- Redirection vers `/dashboard` après succès
- Route protégée : `/change-password`

## 📁 Structure des fichiers

```
src/
├── api/
│   ├── auth.api.ts          # API d'authentification (login, register, forgot, reset, change)
│   └── client.ts            # Client Axios avec intercepteurs
├── pages/auth/
│   ├── LoginPage.tsx        # Page de connexion
│   ├── RegisterPage.tsx     # Page d'inscription
│   ├── ForgotPasswordPage.tsx    # Demande de réinitialisation
│   ├── ResetPasswordPage.tsx     # Réinitialisation avec token
│   └── ChangePasswordPage.tsx    # Changement de mot de passe (connecté)
├── stores/
│   └── auth.store.ts        # Store Zustand pour l'authentification
└── router/
    └── index.tsx            # Configuration des routes
```

## 🔌 Endpoints API utilisés

| Endpoint | Méthode | Description | Body |
|----------|---------|-------------|------|
| `/auth/register` | POST | Inscription | `{ nom, prenom, email, telephone, identifiant, motDePasse, role }` |
| `/auth/login` | POST | Connexion | `{ email, motDePasse }` |
| `/auth/forgot-password` | POST | Demande de réinitialisation | `{ email }` |
| `/auth/reset-password` | POST | Réinitialisation avec token | `{ token, nouveauMotDePasse }` |
| `/auth/change-password` | POST | Changement (connecté) | `{ ancienMotDePasse, nouveauMotDePasse }` |

## 🔐 Sécurité

### Client Axios (client.ts)
- **Intercepteur de requête** : Ajoute automatiquement le token JWT dans l'en-tête `Authorization: Bearer <token>`
- **Intercepteur de réponse** : Déconnecte l'utilisateur et redirige vers `/login` en cas d'erreur 401

### Store d'authentification (auth.store.ts)
- Utilise Zustand avec middleware `persist`
- Stockage local du token et des informations utilisateur
- Méthodes :
  - `setAuth(token, utilisateur)` : Enregistre l'authentification
  - `logout()` : Déconnexion complète
  - `hasRole(roles)` : Vérification des permissions

### Routes protégées
- `ProtectedRoute` : Vérifie l'authentification
- Redirection automatique vers `/login` si non connecté
- Vérification des rôles pour les routes admin

## 🎨 Validation des mots de passe

Règles appliquées partout :
- ✅ Minimum 6 caractères
- ✅ Au moins une majuscule
- ✅ Au moins un chiffre
- ✅ Confirmation identique

Indicateurs visuels en temps réel avec icônes vertes/grises.

## 🚀 Routes disponibles

### Routes publiques
- `/login` - Connexion
- `/register` - Inscription
- `/forgot-password` - Mot de passe oublié
- `/reset-password?token=...` - Réinitialisation

### Routes protégées (authentification requise)
- `/dashboard` - Tableau de bord
- `/change-password` - Changement de mot de passe
- `/profil` - Profil utilisateur
- ... (autres routes de l'application)

## 📦 Dépendances utilisées

- `react-hook-form` + `@hookform/resolvers` : Gestion des formulaires
- `zod` : Validation des schémas
- `@tanstack/react-query` : Gestion des requêtes API
- `axios` : Client HTTP
- `zustand` : Gestion d'état
- `react-router-dom` : Routing
- `sonner` : Notifications toast
- `lucide-react` : Icônes

## 🔄 Flux d'authentification

### Inscription
1. Utilisateur remplit le formulaire → Validation Zod
2. Soumission → `authApi.register()`
3. Succès → Toast + Redirection `/login`
4. Erreur → Toast avec message d'erreur

### Connexion
1. Utilisateur entre email/mot de passe → Validation
2. Soumission → `authApi.login()`
3. Succès → `setAuth(token, utilisateur)` + Redirection `/dashboard`
4. Token stocké dans localStorage (persist)
5. Erreur → Message d'erreur affiché

### Réinitialisation
1. Utilisateur demande réinitialisation → `authApi.forgotPassword()`
2. Email envoyé avec lien contenant token
3. Clic sur lien → Ouverture `/reset-password?token=...`
4. Nouveau mot de passe → `authApi.resetPassword()`
5. Succès → Redirection `/login`

### Changement (connecté)
1. Utilisateur accède à `/change-password`
2. Entre ancien + nouveau mot de passe
3. Soumission → `authApi.changePassword()`
4. Succès → Redirection `/dashboard`

## ⚙️ Configuration requise

### Variables d'environnement (.env)
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Backend attendu
Le backend doit implémenter les endpoints listés ci-dessus et retourner :
- Pour `/auth/login` et `/auth/register` : `{ token: string, utilisateur: Utilisateur }`
- Pour les autres : Réponse de succès ou erreur appropriée

## 🎯 Prochaines étapes possibles

- [ ] Ajouter la vérification d'email
- [ ] Implémenter le refresh token
- [ ] Ajouter l'authentification à deux facteurs (2FA)
- [ ] Ajouter la connexion via OAuth (Google, etc.)
- [ ] Implémenter la limitation des tentatives de connexion
- [ ] Ajouter des logs d'activité de connexion
