# Rapport de Revue de Code — Projet power_esta (Bibliothèque ESTA)

**Date :** 2025  
**Projet :** Système de Gestion de Bibliothèque Universitaire  
**Stack :** Spring Boot 3.5.4 (Java 17) + React 19 / TypeScript + Tauri 2 + PostgreSQL

---

## 1. Vue d'ensemble de l'architecture

| Couche | Technologie | Observations |
|---|---|---|
| Backend | Spring Boot 3.5.4, JPA, Flyway | Architecture en couches bien structurée |
| Frontend | React 19, Vite, TanStack Query, Zustand | SPA moderne avec client desktop Tauri |
| Base de données | PostgreSQL + Flyway (13 migrations) | Schéma versionné, Flyway désactivé en prod |
| Sécurité | JWT (JJWT 0.12.6), BCrypt, 2FA TOTP | Bonne base, quelques points à corriger |
| Export | iText PDF, Apache POI Excel | Deux bibliothèques PDF (iText 5 + 8) |

---

## 2. Points positifs

- Architecture en couches claire : `controller → service → repository`
- Utilisation de `@Transactional` cohérente avec `readOnly = true` sur les lectures
- Gestion des erreurs centralisée via `GlobalExceptionHandler`
- Authentification robuste : JWT + refresh token + 2FA TOTP + verrouillage de compte
- Rate limiting côté client dans `client.ts` avec détection de contenu suspect
- Audit log des connexions et actions sensibles
- Notifications email configurables par utilisateur
- Scheduler pour la détection automatique des retards et rappels
- Système de permissions granulaire par rôle + permissions personnalisées

---

## 3. Problèmes identifiés

### 3.1 Sécurité — Critique

#### `application.properties` — Flyway désactivé en production
```properties
spring.flyway.enabled=false
```
Le schéma est géré par `ddl-auto=update` au lieu de Flyway. Cela est risqué en production : les migrations ne sont pas tracées et des incohérences de schéma peuvent survenir silencieusement.  
**Recommandation :** Réactiver Flyway et passer `ddl-auto` à `validate`.

#### `application.properties` — Logs SQL en production
```properties
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql=TRACE
```
Ces paramètres exposent les requêtes SQL (avec valeurs) dans les logs. En production, cela peut fuiter des données sensibles.  
**Recommandation :** Désactiver ou conditionner à un profil `dev`.

#### `SecurityConfig.java` — CORS trop permissif
```java
configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "tauri://localhost"));
configuration.setAllowedHeaders(Arrays.asList("*"));
```
`http://localhost:*` autorise n'importe quel port local. En production, les origines doivent être explicitement listées.  
**Recommandation :** Lire les origines depuis `app.frontend.cors-origins` (déjà défini dans `application.properties`).

#### `AuthApiController.java` — `forgot-password` non implémenté
```java
@PostMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(...) {
    return ResponseEntity.ok(Map.of("message", "Si ce compte existe..."));
}
```
L'endpoint retourne toujours un succès sans envoyer d'email ni générer de token de réinitialisation. Un attaquant peut exploiter cela pour confirmer l'existence d'un compte.  
**Recommandation :** Implémenter la logique complète ou retirer l'endpoint.

#### `Utilisateur.java` — Refresh token stocké en clair
```java
@Column(length = 512)
private String refreshToken;
```
Le refresh token est stocké en clair en base. En cas de fuite de la base, tous les tokens sont compromis.  
**Recommandation :** Stocker un hash (SHA-256) du refresh token.

---

### 3.2 Qualité du code — Majeur

#### `LivreServiceImpl.java` — Import dupliqué
```java
import com.biblioteca.repository.LangueRepository;
import com.biblioteca.repository.LangueRepository;
```
Import en double, probablement une erreur de copier-coller. Ne cause pas d'erreur de compilation mais indique un manque de revue.

#### `UtilisateurServiceImpl.java` — Double envoi d'email de bienvenue
```java
emailService.sendWelcomeEmail(...);       // EmailService
notificationService.envoyerEmailBienvenue(saved); // NotificationService
```
L'email de bienvenue est envoyé deux fois via deux services différents. L'utilisateur reçoit deux emails identiques à l'inscription.  
**Recommandation :** Supprimer l'un des deux appels.

#### `UtilisateurServiceImpl.java` — `System.out.println` en production
```java
System.out.println("Envoi email de bienvenue à: " + saved.getEmail());
System.err.println("Erreur email bienvenue: " + e.getMessage());
```
Utilisation de `System.out/err` au lieu du logger SLF4J. Cela contourne la configuration de logging et peut exposer des emails dans les logs.  
**Recommandation :** Remplacer par `log.info(...)` / `log.error(...)` avec Lombok `@Slf4j`.

#### `EmpruntServiceImpl.java` — HTML inline dans le service métier
```java
private String buildRappelHtml(Emprunt e) {
    return "<!DOCTYPE html><html><body style='...'>" + ...;
}
```
Le template HTML est construit par concaténation de chaînes dans la couche service. Cela mélange la logique métier et la présentation, et est difficile à maintenir.  
**Recommandation :** Utiliser Thymeleaf (déjà présent dans le projet) pour les templates email.

#### `ReservationServiceImpl.java` — Mauvais type de notification à l'annulation
```java
notificationService.notifier(r.getUtilisateur(), TypeNotification.RESERVATION_CREEE,
    "Votre réservation ... a été annulée.", CanalNotification.INTERNE);
```
Le type `RESERVATION_CREEE` est utilisé pour une annulation. Cela fausse les statistiques et l'historique des notifications.  
**Recommandation :** Utiliser `TypeNotification.RESERVATION_ANNULEE` (ou créer ce type s'il n'existe pas).

#### `auth.store.ts` — Token JWT persisté dans `localStorage`
```typescript
persist(... { name: "auth-storage" })
```
Zustand `persist` utilise `localStorage` par défaut. Le JWT et le refresh token sont donc accessibles via JavaScript, ce qui les expose aux attaques XSS.  
**Recommandation :** Stocker uniquement les données non-sensibles (utilisateur, rôle) en `localStorage` et gérer les tokens en mémoire uniquement.

---

### 3.3 Qualité du code — Mineur

#### `application.properties` — `spring.jpa.hibernate.ddl-auto=update`
En production, `update` peut modifier le schéma de manière imprévisible. Préférer `validate` avec Flyway activé.

#### `client.ts` — Sanitisation des données avant envoi
```typescript
config.data = sanitizeData(config.data);
// puis
if (containsSuspiciousContent(config.data)) { ... }
```
La sanitisation est appliquée avant la vérification. Si `sanitizeData` transforme `<script>` en `&lt;script&gt;`, la vérification suivante ne détectera plus le contenu suspect. L'ordre devrait être : vérifier d'abord, puis sanitiser.

#### `guards.tsx` — Vérification `utilisateur.actif` après rendu
```typescript
if (utilisateur && !utilisateur.actif) {
    useAuthStore.getState().logout();
    return <Navigate to="/accueil" ... />;
}
```
Le logout est appelé pendant le rendu React (effet de bord dans le render). Cela peut causer des avertissements React.  
**Recommandation :** Déplacer le logout dans un `useEffect`.

#### `pom.xml` — Deux versions d'iText
```xml
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itextpdf</artifactId>
    <version>5.5.13.3</version>  <!-- iText 5, LGPL -->
</dependency>
```
La propriété `itext.version=8.0.5` est définie mais iText 8 n'est pas utilisé. Seul iText 5 est déclaré. La version 5 est ancienne (2016) et a des vulnérabilités connues.  
**Recommandation :** Migrer vers iText 8 ou utiliser OpenPDF (fork open-source d'iText 5).

---

## 4. Résumé des priorités

| Priorité | Problème | Fichier |
|---|---|---|
| 🔴 Critique | Flyway désactivé, `ddl-auto=update` en prod | `application.properties` |
| 🔴 Critique | Logs SQL activés en prod | `application.properties` |
| 🔴 Critique | `forgot-password` non implémenté | `AuthApiController.java` |
| 🔴 Critique | Refresh token en clair en base | `Utilisateur.java` |
| 🟠 Majeur | JWT dans localStorage (XSS) | `auth.store.ts` |
| 🟠 Majeur | Double email de bienvenue | `UtilisateurServiceImpl.java` |
| 🟠 Majeur | CORS trop permissif | `SecurityConfig.java` |
| 🟠 Majeur | Mauvais type de notification | `ReservationServiceImpl.java` |
| 🟡 Mineur | HTML inline dans service métier | `EmpruntServiceImpl.java` |
| 🟡 Mineur | Import dupliqué | `LivreServiceImpl.java` |
| 🟡 Mineur | `System.out` au lieu de logger | `UtilisateurServiceImpl.java` |
| 🟡 Mineur | Ordre sanitisation/vérification inversé | `client.ts` |
| 🟡 Mineur | Effet de bord dans render React | `guards.tsx` |
| 🟡 Mineur | iText 5 obsolète | `pom.xml` |

---

## 5. Recommandations générales

1. **Profils Spring** : Créer des profils `dev` / `prod` pour séparer la configuration (logs SQL, Flyway, CORS).
2. **Tests** : Seuls 3 fichiers de tests existent (`EmpruntServiceImplTest`, `LivreServiceImplTest`, `ReservationServiceImplTest`). Augmenter la couverture, notamment sur `AuthApiController` et les services critiques.
3. **Variables d'environnement** : Le fichier `.env` est présent dans le dépôt. S'assurer qu'il est dans `.gitignore` et ne contient pas de secrets réels.
4. **Fichiers de log** : `backend.log`, `backend_debug.log`, etc. sont commités dans le dépôt. Les ajouter au `.gitignore`.
5. **Fichiers SQL à la racine** : De nombreux fichiers SQL (`fix_permissions.sql`, `clean_permissions.sql`, etc.) sont à la racine du projet. Les intégrer dans les migrations Flyway ou les supprimer.
