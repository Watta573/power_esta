# Diagrammes UML — Bibliothèque ESTA (suite)
> Coller chaque bloc dans https://mermaid.live

---

## 17. Diagramme de cas d'utilisation

```mermaid
graph TB
    %% Acteurs
    ETUDIANT(["👤 Étudiant / Enseignant\n/ Public"])
    BIBLIO(["👤 Bibliothécaire"])
    ADMIN(["👤 Administrateur"])
    SCHED(["⚙️ Scheduler\n(système)"])

    %% Cas d'utilisation — Authentification
    subgraph UC_AUTH["Authentification"]
        UC1["S'inscrire"]
        UC2["Se connecter"]
        UC3["Activer 2FA"]
        UC4["Réinitialiser mot de passe"]
        UC5["Vérifier email"]
    end

    %% Cas d'utilisation — Catalogue
    subgraph UC_CAT["Catalogue"]
        UC6["Consulter le catalogue"]
        UC7["Rechercher un livre"]
        UC8["Voir détail d'un livre"]
    end

    %% Cas d'utilisation — Emprunts
    subgraph UC_EMP["Emprunts"]
        UC9["Emprunter un livre"]
        UC10["Retourner un livre"]
        UC11["Renouveler un emprunt"]
        UC12["Consulter ses emprunts"]
        UC13["Payer une amende"]
    end

    %% Cas d'utilisation — Réservations
    subgraph UC_RES["Réservations"]
        UC14["Réserver un livre"]
        UC15["Annuler une réservation"]
        UC16["Confirmer une réservation"]
        UC17["Consulter ses réservations"]
    end

    %% Cas d'utilisation — Profil
    subgraph UC_PROFIL["Profil"]
        UC18["Modifier son profil"]
        UC19["Changer mot de passe"]
        UC20["Gérer notifications email"]
    end

    %% Cas d'utilisation — Admin/Biblio
    subgraph UC_ADMIN["Gestion (Admin / Bibliothécaire)"]
        UC21["Gérer les livres\n(CRUD + exemplaires)"]
        UC22["Gérer les utilisateurs"]
        UC23["Gérer les fournisseurs"]
        UC24["Gérer les acquisitions"]
        UC25["Gérer les périodiques"]
        UC26["Consulter les rapports"]
        UC27["Envoyer des relances"]
        UC28["Gérer les cotisations"]
    end

    %% Cas d'utilisation — Admin uniquement
    subgraph UC_ADMIN_ONLY["Administration (Admin uniquement)"]
        UC29["Gérer le personnel"]
        UC30["Gérer les permissions"]
        UC31["Consulter les logs d'audit"]
        UC32["Gérer les formules d'abonnement"]
    end

    %% Cas d'utilisation — Scheduler
    subgraph UC_SCHED["Tâches automatiques"]
        UC33["Détecter les retards\n(cron 8h00)"]
        UC34["Envoyer rappels J-3"]
        UC35["Expirer les réservations\n(cron /h)"]
    end

    %% Relations Étudiant/Enseignant/Public
    ETUDIANT --> UC1
    ETUDIANT --> UC2
    ETUDIANT --> UC3
    ETUDIANT --> UC4
    ETUDIANT --> UC5
    ETUDIANT --> UC6
    ETUDIANT --> UC7
    ETUDIANT --> UC8
    ETUDIANT --> UC12
    ETUDIANT --> UC14
    ETUDIANT --> UC15
    ETUDIANT --> UC17
    ETUDIANT --> UC18
    ETUDIANT --> UC19
    ETUDIANT --> UC20
    ETUDIANT --> UC11
    ETUDIANT --> UC13

    %% Relations Bibliothécaire (hérite des droits utilisateur + gestion)
    BIBLIO --> UC9
    BIBLIO --> UC10
    BIBLIO --> UC16
    BIBLIO --> UC21
    BIBLIO --> UC22
    BIBLIO --> UC23
    BIBLIO --> UC24
    BIBLIO --> UC25
    BIBLIO --> UC26
    BIBLIO --> UC27
    BIBLIO --> UC28

    %% Relations Admin (hérite de tout)
    ADMIN --> UC29
    ADMIN --> UC30
    ADMIN --> UC31
    ADMIN --> UC32

    %% Scheduler
    SCHED --> UC33
    SCHED --> UC34
    SCHED --> UC35
```

---

## 18. Diagramme d'objets — Scénario : emprunt en cours avec réservation en attente

```mermaid
classDiagram
    direction LR

    class utilisateur1 {
        <<object : Utilisateur>>
        id = 42
        nom = "Diallo"
        prenom = "Mamadou"
        email = "m.diallo@esta.cd"
        role = ETUDIANT
        actif = true
        loginAttempts = 0
        totpActif = false
        notifEmailRappelRetour = true
    }

    class utilisateur2 {
        <<object : Utilisateur>>
        id = 57
        nom = "Kabila"
        prenom = "Jeanne"
        email = "j.kabila@esta.cd"
        role = ENSEIGNANT
        actif = true
        loginAttempts = 0
        totpActif = true
    }

    class livre1 {
        <<object : Livre>>
        id = 101
        titre = "Algorithmes et structures de données"
        isbn = "978-2-10-082345-6"
        auteur = "Thomas H. Cormen"
        editeur = "Dunod"
        anneePublication = 2022
        actif = true
    }

    class categorie1 {
        <<object : Categorie>>
        id = 3
        nom = "Informatique"
        couleur = "#2563eb"
    }

    class exemplaire1 {
        <<object : Exemplaire>>
        id = 201
        codeExemplaire = "INF-101-A"
        etat = BON
        disponible = false
        localisation = "Rayon A - Étagère 3"
    }

    class exemplaire2 {
        <<object : Exemplaire>>
        id = 202
        codeExemplaire = "INF-101-B"
        etat = BON
        disponible = true
        localisation = "Rayon A - Étagère 3"
    }

    class emprunt1 {
        <<object : Emprunt>>
        id = 305
        dateEmprunt = 2025-06-01
        dateRetourPrevue = 2025-06-15
        dateRetourEffective = null
        statut = EN_COURS
        nombreRenouvellements = 0
        amende = 0.00
    }

    class reservation1 {
        <<object : Reservation>>
        id = 88
        dateReservation = 2025-06-03T10:30:00
        dateExpiration = 2025-06-06
        statut = EN_ATTENTE
        position = 1
        notifie = false
    }

    class notification1 {
        <<object : Notification>>
        id = 512
        type = EMPRUNT_CREE
        message = "Emprunt créé pour Algorithmes..."
        dateEnvoi = 2025-06-01T09:15:00
        lu = true
        canal = INTERNE
    }

    class cotisation1 {
        <<object : Cotisation>>
        id = 15
        montant = 5000.00
        dateDebut = 2025-01-01
        dateFin = 2025-12-31
        statut = ACTIVE
        codeReservation = "A3F9B2C1"
    }

    utilisateur1 --> emprunt1 : emprunte
    utilisateur1 --> notification1 : reçoit
    utilisateur1 --> cotisation1 : souscrit
    utilisateur2 --> reservation1 : réserve
    livre1 --> categorie1 : appartient à
    livre1 --> exemplaire1 : possède
    livre1 --> exemplaire2 : possède
    exemplaire1 --> emprunt1 : fait l objet de
    reservation1 --> livre1 : concerne
```

---

## 19. Diagramme d'états-transitions — Compte Utilisateur

```mermaid
stateDiagram-v2
    [*] --> INACTIF : inscrire()\n[email non vérifié]

    INACTIF --> ACTIF : verifierEmail(token)\n[emailVerifie = true]

    ACTIF --> VERROUILLE : login() échoue\n[loginAttempts >= 5]

    VERROUILLE --> ACTIF : lockedUntil < now\n[déverrouillage auto 15min]

    ACTIF --> SUSPENDU : admin.activer(false)\n[actif = false]

    SUSPENDU --> ACTIF : admin.activer(true)\n[actif = true]

    ACTIF --> ACTIF_2FA : activer2FA()\n[totpActif = true]

    ACTIF_2FA --> ACTIF : desactiver2FA()\n[totpActif = false]

    ACTIF --> ACTIF : changerMotDePasse()\nmodifierProfil()\nchangerRole()

    SUSPENDU --> [*] : supprimerCompte()
    ACTIF --> [*] : supprimerCompte()

    note right of VERROUILLE
        lockedUntil = now + 15min
        loginAttempts reset à 0
        après déverrouillage
    end note

    note right of ACTIF_2FA
        Connexion nécessite
        email + mdp + code TOTP
    end note
```

---

## 20. Diagramme d'états-transitions — Notification

```mermaid
stateDiagram-v2
    [*] --> NON_LUE : notifier()\n[lu = false]

    NON_LUE --> LUE : marquerCommeLue()\n[lu = true]

    LUE --> [*] : supprimer()
    NON_LUE --> [*] : supprimer()

    note right of NON_LUE
        canal : INTERNE / EMAIL / SMS
        types : RAPPEL_RETOUR, LIVRE_DISPONIBLE,
        RETARD_CONSTATE, AMENDE_GENEREE,
        EMPRUNT_CREE, RETOUR_CONFIRME,
        RESERVATION_CREEE, RESERVATION_EXPIREE
    end note
```

---

## 21. Diagramme d'états-transitions — Cotisation (Abonnement)

```mermaid
stateDiagram-v2
    [*] --> EN_ATTENTE : creerCotisation()\n[paiement non confirmé]

    EN_ATTENTE --> ACTIVE : confirmerPaiement()\n[datePaiement = today]

    EN_ATTENTE --> ANNULEE : annuler()

    ACTIVE --> EXPIREE : Scheduler\n[dateFin < today]

    ACTIVE --> ANNULEE : annuler()\n[remboursement]

    EXPIREE --> EN_ATTENTE : renouveler()\n[nouvelle cotisation]

    ANNULEE --> [*]
    EXPIREE --> [*]

    note right of ACTIVE
        codeReservation généré
        maxEmpruntsSimultanes
        selon FormulaAbonnement
    end note
```

---

## 22. Diagramme d'interaction — Vue d'ensemble du système (Communication)

```mermaid
sequenceDiagram
    box "Frontend (Tauri / Browser)"
        participant U as Utilisateur
        participant F as React App
        participant ZS as Zustand Store
        participant AX as Axios Client
    end

    box "Backend Spring Boot"
        participant SEC as JwtFilter + Security
        participant CTRL as Controllers
        participant SVC as Services
        participant SCHED as Schedulers
    end

    box "Infrastructure"
        participant DB as PostgreSQL
        participant MAIL as Gmail SMTP
    end

    Note over U,MAIL: Flux 1 — Connexion
    U->>F: login(email, mdp)
    F->>AX: POST /api/auth/login
    AX->>SEC: Bearer absent → route publique
    SEC->>CTRL: AuthApiController.login()
    CTRL->>DB: findByEmail + vérif mdp
    CTRL->>DB: save(refreshToken)
    CTRL-->>AX: {token, refreshToken, utilisateur}
    AX-->>ZS: setAuth(token, user)
    ZS-->>F: isAuthenticated = true
    F-->>U: Redirige /dashboard

    Note over U,MAIL: Flux 2 — Requête protégée
    U->>F: Consulte /emprunts
    F->>AX: GET /api/emprunts (+ JWT header)
    AX->>SEC: JwtAuthenticationFilter.doFilter()
    SEC->>SEC: JwtService.parseToken(jwt)
    SEC->>CTRL: EmpruntApiController.lister()
    CTRL->>SVC: EmpruntServiceImpl.getEmprunts()
    SVC->>DB: findByUtilisateurId()
    DB-->>SVC: List~Emprunt~
    SVC-->>CTRL: List~EmpruntDto~
    CTRL-->>AX: 200 JSON
    AX-->>F: data
    F-->>U: Affiche liste emprunts

    Note over U,MAIL: Flux 3 — Tâche planifiée (sans interaction utilisateur)
    SCHED->>SVC: detecterRetardsEtRappeler() [8h00]
    SVC->>DB: findByDateRetourPrevueBefore(today)
    DB-->>SVC: emprunts en retard
    SVC->>DB: statut = EN_RETARD
    SVC->>MAIL: envoyerEmailRetard()
    MAIL-->>U: Email "Retard constaté"
```

---

## 23. Diagramme d'interaction — Cycle complet Réservation → Emprunt

```mermaid
sequenceDiagram
    actor U1 as Utilisateur A\n(emprunteur actuel)
    actor U2 as Utilisateur B\n(en file d'attente)
    participant F as Frontend
    participant RS as ReservationService
    participant ES as EmpruntService
    participant NS as NotificationService
    participant DB as PostgreSQL

    Note over U2,DB: U2 réserve un livre indisponible
    U2->>F: POST /api/reservations {livreId}
    F->>RS: creerReservation(U2.id, livreId)
    RS->>DB: save(Reservation EN_ATTENTE, position=1)
    RS->>NS: envoyerEmailReservationCreee(U2, position=1)
    NS-->>U2: Email "Réservation confirmée, position 1"

    Note over U1,DB: U1 retourne le livre
    U1->>F: POST /api/emprunts/{id}/retour
    F->>ES: enregistrerRetour(empruntId)
    ES->>DB: statut=RETOURNE, exemplaire.disponible=true
    ES->>NS: envoyerEmailRetourConfirme(U1)
    NS-->>U1: Email "Retour confirmé"

    ES->>RS: notifierProchainEnAttente(livreId)
    RS->>DB: findFirstReservation EN_ATTENTE → U2
    RS->>DB: statut=DISPONIBLE, dateExpiration=now+3j
    RS->>NS: envoyerEmailLivreDisponible(U2)
    NS-->>U2: Email "Votre livre est disponible !"

    Note over U2,DB: U2 confirme et emprunte
    U2->>F: POST /api/reservations/{id}/confirmer
    F->>RS: confirmerReservation(reservationId)
    RS->>DB: statut=CONFIRMEE
    RS->>ES: creerEmprunt(U2.id, exemplaireId)
    ES->>DB: save(Emprunt EN_COURS), exemplaire.disponible=false
    ES->>NS: envoyerEmailEmprunt(U2)
    NS-->>U2: Email "Emprunt créé, retour le ..."
```
