package com.biblioteca.entity;

import com.biblioteca.entity.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 120)
  private String nom;

  @Column(nullable = false, length = 120)
  private String prenom;

  @Column(nullable = false, unique = true, length = 32)
  private String identifiant;

  @Column(nullable = false, unique = true, length = 180)
  private String email;

  @Column(nullable = false, length = 255)
  private String password;

  @Column(length = 30)
  private String telephone;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private Role role;

  @Column(nullable = false)
  private Boolean actif;

  @Column(nullable = false)
  private LocalDate dateInscription;

  @Column(nullable = false)
  private LocalDateTime dateCreation;

  @Column(nullable = false)
  private Boolean emailVerifie;

  @Column(length = 255)
  private String tokenVerification;

  @Column(length = 512)
  private String refreshToken;

  @Column
  private LocalDateTime refreshTokenExpiry;

  @Column(length = 64)
  private String totpSecret;

  @Column(nullable = false)
  private Boolean totpActif;

  @Column(nullable = false)
  private Integer loginAttempts;

  @Column
  private LocalDateTime lockedUntil;

  // ── Préférences notifications email ──────────────────────────────────────
  @Column(nullable = false)
  private Boolean notifEmailEmprunt = true;

  @Column(nullable = false)
  private Boolean notifEmailRetour = true;

  @Column(nullable = false)
  private Boolean notifEmailReservation = true;

  @Column(nullable = false)
  private Boolean notifEmailLivreDisponible = true;

  @Column(nullable = false)
  private Boolean notifEmailNouveauLivre = false;

  @Column(nullable = false)
  private Boolean notifEmailRappelRetour = true;

  @Column(length = 512)
  private String photoUrl;

  // ── Permissions personnalisées ──────────────────────────────────────────
  @OneToMany(mappedBy = "utilisateur")
  private List<UtilisateurPermission> permissions;

  @PrePersist
  void prePersist() {
    if (actif == null) actif = true;
    if (dateInscription == null) dateInscription = LocalDate.now();
    if (dateCreation == null) dateCreation = LocalDateTime.now();
    if (emailVerifie == null) emailVerifie = false;
    if (totpActif == null) totpActif = false;
    if (loginAttempts == null) loginAttempts = 0;
    if (notifEmailEmprunt == null) notifEmailEmprunt = true;
    if (notifEmailRetour == null) notifEmailRetour = true;
    if (notifEmailReservation == null) notifEmailReservation = true;
    if (notifEmailLivreDisponible == null) notifEmailLivreDisponible = true;
    if (notifEmailNouveauLivre == null) notifEmailNouveauLivre = false;
    if (notifEmailRappelRetour == null) notifEmailRappelRetour = true;
  }
}

