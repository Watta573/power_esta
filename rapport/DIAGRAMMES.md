# Diagrammes — Bibliothèque ESTA
> Coller chaque bloc dans https://mermaid.live

---

## 1. Diagramme de classes — Entités JPA

```mermaid
classDiagram
    direction TB

    class Utilisateur {
        +Long id
        +String nom
        +String prenom
        +String identifiant
        +String email
        +String password
        +String telephone
        +Role role
        +Boolean actif
        +LocalDate dateInscription
        +Boolean emailVerifie
        +String totpSecret
        +Boolean totpActif
        +Integer loginAttempts
        +LocalDateTime lockedUntil
        +String refreshToken
    }

    class Livre {
        +Long id
        +String titre
        +String isbn
        +String auteur
        +String editeur
        +String edition
        +Integer anneePublication
        +String description
        +Integer nombrePages
        +LocalDate dateAjout
        +Boolean actif
    }

    class Exemplaire {
        +Long id
        +String codeExemplaire
        +EtatExemplaire etat
        +Boolean disponible
        +String localisation
    }

    class Categorie {
        +Long id
        +String nom
        +String description
        +String couleur
    }

    class Langue {
        +Long id
        +String nom
    }

    class Emprunt {
        +Long id
        +LocalDate dateEmprunt
        +LocalDate dateRetourPrevue
        +LocalDate dateRetourEffective
        +StatutEmprunt statut
        +Integer nombreRenouvellements
        +BigDecimal amende
        +String notes
    }

    class Reservation {
        +Long id
        +LocalDateTime dateReservation
        +LocalDate dateExpiration
        +StatutReservation statut
        +Integer position
        +Boolean notifie
    }

    class Notification {
        +Long id
        +TypeNotification type
        +String message
        +LocalDateTime dateEnvoi
        +Boolean lu
        +CanalNotification canal
    }

    class Cotisation {
        +Long id
        +BigDecimal montant
        +LocalDate dateDebut
        +LocalDate dateFin
        +String statut
        +LocalDate datePaiement
        +String codeReservation
    }

    class FormulaAbonnement {
        +Long id
        +String nom
        +String description
        +BigDecimal prix
        +Integer dureeMois
        +Integer maxEmpruntsSimultanes
        +Boolean actif
    }

    class Fournisseur {
        +Long id
        +String nom
        +String email
        +String telephone
        +String adresse
        +Boolean actif
        +LocalDate dateCreation
    }

    class CommandeAchat {
        +Long id
        +Integer nbTitres
        +BigDecimal montant
        +LocalDate dateCommande
        +LocalDate dateLivraison
        +String statut
    }

    class Permission {
        +Long id
        +String code
        +String nom
        +String module
        +Boolean actif
    }

    class UtilisateurPermission {
        +Long id
        +Boolean accorde
        +LocalDateTime dateAccord
        +String notes
    }

    class AuditLog {
        +Long id
        +Long utilisateurId
        +String email
        +String role
        +String action
        +String details
        +String ipAddress
        +LocalDateTime dateAction
        +String statut
    }

    class Periodique {
        +Long id
        +String titre
        +String issn
        +String editeur
        +String frequence
        +Boolean actif
        +LocalDate dateAjout
    }

    class Role {
        <<enumeration>>
        ADMIN
        BIBLIOTHECAIRE
        ENSEIGNANT
        ETUDIANT
        PUBLIC
    }

    class StatutEmprunt {
        <<enumeration>>
        EN_COURS
        RETOURNE
        EN_RETARD
        PERDU
    }

    class StatutReservation {
        <<enumeration>>
        EN_ATTENTE
        DISPONIBLE
        CONFIRMEE
        ANNULEE
        EXPIREE
    }

    class EtatExemplaire {
        <<enumeration>>
        BON
        ABIME
        PERDU
    }

    Utilisateur "1" --> "0..*" Emprunt : emprunte
    Utilisateur "1" --> "0..*" Reservation : réserve
    Utilisateur "1" --> "0..*" Notification : reçoit
    Utilisateur "1" --> "0..*" Cotisation : souscrit
    Utilisateur "1" --> "0..*" UtilisateurPermission : possède
    Utilisateur --> Role

    Livre "1" --> "1..*" Exemplaire : possède
    Livre "*" --> "1" Categorie : appartient
    Livre "*" --> "*" Langue : écrit en

    Exemplaire "1" --> "0..*" Emprunt : fait l objet
    Reservation "*" --> "1" Livre : concerne

    Emprunt --> StatutEmprunt
    Reservation --> StatutReservation
    Exemplaire --> EtatExemplaire

    UtilisateurPermission "*" --> "1" Permission : référence
    CommandeAchat "*" --> "1" Fournisseur : passée à
```

---

## 2. Diagramme de séquence — Connexion (Login + 2FA)

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as Frontend (React)
    participant A as AuthApiController
    participant DB as PostgreSQL
    participant Audit as AuditService

    U->>F: Saisit email + mot de passe
    F->>A: POST /api/auth/login
    A->>DB: findByEmail(email)
    DB-->>A: Utilisateur

    alt Compte verrouillé
        A-->>F: 429 Compte verrouillé X min
    else Mauvais mot de passe
        A->>DB: loginAttempts++
        alt 5 tentatives atteintes
            A->>DB: lockedUntil = now + 15min
            A-->>F: 429 Compte verrouillé
        else
            A-->>F: 401 Identifiants invalides (N restants)
        end
    else Authentification OK
        A->>DB: loginAttempts = 0
        alt 2FA activé
            A-->>F: 202 requires2fa: true
            U->>F: Saisit code TOTP
            F->>A: POST /api/auth/login (avec totpCode)
            A->>A: TotpUtil.verify(secret, code)
            alt Code invalide
                A-->>F: 401 Code 2FA invalide
            end
        end
        A->>DB: Sauvegarde refreshToken
        A->>Audit: log(SUCCESS)
        A-->>F: 200 {token, refreshToken, utilisateur}
        F->>F: Zustand setAuth() + loadPermissions()
    end
```

---

## 3. Diagramme de séquence — Cycle de vie d'un emprunt

```mermaid
sequenceDiagram
    actor B as Bibliothécaire
    participant E as EmpruntApiController
    participant ES as EmpruntServiceImpl
    participant DB as PostgreSQL
    participant NS as NotificationService
    participant RS as ReservationService

    B->>E: POST /api/emprunts {utilisateurId, exemplaireId}
    E->>ES: creerEmprunt(userId, exemplaireId)
    ES->>DB: findById(utilisateur)
    ES->>DB: findById(exemplaire)
    ES->>DB: existsByUtilisateurId + EN_RETARD ?
    alt Retard existant
        ES-->>E: BusinessException "Utilisateur bloqué"
    end
    ES->>DB: countByUtilisateurId + EN_COURS
    alt Quota dépassé
        ES-->>E: BusinessException "Quota dépassé"
    end
    ES->>DB: save(Emprunt EN_COURS)
    ES->>DB: exemplaire.disponible = false
    ES->>NS: envoyerEmailEmprunt()
    ES-->>E: Emprunt créé
    E-->>B: 200 EmpruntDto

    Note over B,RS: Retour du livre
    B->>E: POST /api/emprunts/{id}/retour
    E->>ES: enregistrerRetour(empruntId)
    ES->>ES: calculerAmende()
    ES->>DB: statut = RETOURNE, dateRetourEffective
    ES->>DB: exemplaire.disponible = true
    ES->>NS: envoyerEmailRetourConfirme()
    alt Amende > 0
        ES->>NS: envoyerEmailAmende()
    end
    ES->>RS: notifierProchainEnAttente(livreId)
    RS->>DB: findFirstReservation EN_ATTENTE
    RS->>NS: envoyerEmailLivreDisponible()
    ES-->>E: Emprunt retourné
    E-->>B: 200 EmpruntDto
```

---

## 4. Diagramme de séquence — Réservation

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant R as ReservationApiController
    participant RS as ReservationServiceImpl
    participant LS as LivreService
    participant DB as PostgreSQL
    participant NS as NotificationService

    U->>R: POST /api/reservations {livreId}
    R->>RS: creerReservation(userId, livreId)
    RS->>LS: obtenirNombreExemplairesDisponibles(livreId)
    alt Exemplaire disponible
        RS-->>R: BusinessException "Livre disponible"
        R-->>U: 400 Erreur
    end
    RS->>DB: countReservations EN_ATTENTE/DISPONIBLE
    alt >= 3 réservations
        RS-->>R: BusinessException "Max 3 réservations"
    end
    RS->>DB: calcul position dans la file
    RS->>DB: save(Reservation EN_ATTENTE, position N)
    RS->>NS: envoyerEmailReservationCreee(position)
    RS-->>R: Reservation
    R-->>U: 200 ReservationDto

    Note over U,NS: Scheduler horaire — vérification expiration
    RS->>DB: findByDateExpirationBefore + DISPONIBLE
    loop Pour chaque réservation expirée
        RS->>DB: statut = EXPIREE
        RS->>NS: envoyerEmailReservationExpiree()
        RS->>RS: notifierProchainEnAttente()
    end
```

---

## 5. Diagramme d'états — Emprunt

```mermaid
stateDiagram-v2
    [*] --> EN_COURS : creerEmprunt()

    EN_COURS --> RETOURNE : enregistrerRetour()\n[dans les délais]
    EN_COURS --> EN_RETARD : Scheduler 8h00\n[dateRetourPrevue < today]
    EN_COURS --> EN_COURS : renouvelerEmprunt()\n[max 1 renouvellement]

    EN_RETARD --> EN_COURS : payerAmende()
    EN_RETARD --> RETOURNE : enregistrerRetour()\n[avec amende calculée]

    RETOURNE --> [*]
    PERDU --> [*]

    EN_COURS --> PERDU : marquer comme perdu
```

---

## 6. Diagramme d'états — Réservation

```mermaid
stateDiagram-v2
    [*] --> EN_ATTENTE : creerReservation()

    EN_ATTENTE --> DISPONIBLE : notifierProchainEnAttente()\n[livre rendu]
    EN_ATTENTE --> ANNULEE : annuler()

    DISPONIBLE --> CONFIRMEE : confirmerReservation()\n→ creerEmprunt()
    DISPONIBLE --> EXPIREE : Scheduler horaire\n[dateExpiration < today]
    DISPONIBLE --> ANNULEE : annuler()

    EXPIREE --> EN_ATTENTE : relancer()
    ANNULEE --> EN_ATTENTE : relancer()

    CONFIRMEE --> [*]
    EXPIREE --> [*]
    ANNULEE --> [*]
```

---

## 7. Architecture applicative (C4 — Conteneurs)

```mermaid
graph TB
    subgraph Client["Client (Desktop / Web)"]
        TAURI["Tauri 2\nApp Desktop"]
        BROWSER["Navigateur Web"]
    end

    subgraph Frontend["Frontend — bibliotheque-app"]
        REACT["React 19 + TypeScript\nVite + TanStack Query\nZustand + React Router"]
    end

    subgraph Backend["Backend — Spring Boot 3.5.4"]
        API["REST API\n/api/**"]
        SEC["Spring Security\nJWT + BCrypt + 2FA"]
        SVC["Services métier\nEmprunt / Réservation\nLivre / Utilisateur"]
        SCHED["Schedulers\nRetards + Rappels\nExpiration réservations"]
        MAIL["Email Service\nGmail SMTP"]
        PDF["Export PDF/Excel\niText + Apache POI"]
    end

    subgraph Data["Données"]
        PG[("PostgreSQL\npower_esta")]
        FLYWAY["Flyway\n13 migrations"]
        UPLOADS["Uploads\n/uploads/couvertures/"]
    end

    TAURI --> REACT
    BROWSER --> REACT
    REACT -->|"HTTP + JWT\nAxios"| API
    API --> SEC
    SEC --> SVC
    SVC --> PG
    SVC --> MAIL
    SVC --> PDF
    SCHED --> SVC
    FLYWAY --> PG
    SVC --> UPLOADS
```

---

## 8. Diagramme de navigation Frontend (Routes)

```mermaid
graph LR
    subgraph Public["Pages publiques"]
        ACC["/accueil"]
        LOGIN["/login"]
        REG["/register"]
        FP["/forgot-password"]
        VE["/verify-email"]
    end

    subgraph Auth["Authentifié — tous rôles"]
        DASH["/dashboard"]
        LIVRES["/livres"]
        LIVRED["/livres/:id"]
        EMP["/emprunts"]
        NEMP["/emprunts/nouveau"]
        RES["/reservations"]
        PER["/periodiques"]
        PROFIL["/profil"]
        FIN["/finances"]
        ACQ["/acquisitions"]
        ABO["/abonnement"]
        COM["/communication"]
    end

    subgraph AdminRoute["AdminRoute — ADMIN ou BIBLIOTHECAIRE"]
        UTIL["/utilisateurs"]
        UTILD["/utilisateurs/:id"]
        RELANCE["/relances"]
        RAPPORT["/rapports"]
        FOURNI["/fournisseurs"]
        ALIVREN["/admin/livres/nouveau"]
        ALIVRM["/admin/livres/:id/modifier"]
    end

    subgraph AdminOnly["AdminOnly — ADMIN uniquement"]
        ADMIN["/administration"]
        PERSO["/personnel"]
    end

    LOGIN -->|"auth OK"| DASH
    ACC --> LOGIN
    DASH --> LIVRES
    DASH --> EMP
    DASH --> RES
```
