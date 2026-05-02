package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "diffusions_groupees")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DiffusionGroupee {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "expediteur_id", nullable = false)
  private Utilisateur expediteur;

  @Column(nullable = false, length = 200)
  private String sujet;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(nullable = false, length = 40)
  private String type;

  // Rôles ciblés stockés en CSV : "ETUDIANT,ENSEIGNANT"
  @Column(nullable = false, length = 200)
  private String rolesCibles;

  @Column(nullable = false)
  private int nbDestinataires;

  @Column(nullable = false)
  private LocalDateTime dateEnvoi;

  // PLANIFIE ou ENVOYE
  @Column(nullable = false, length = 20)
  private String statut;

  // Date d'envoi programmé (null = envoi immédiat)
  private LocalDateTime dateEnvoiProgramme;

  @PrePersist
  void prePersist() {
    if (dateEnvoi == null) dateEnvoi = LocalDateTime.now();
    if (statut == null) statut = "ENVOYE";
  }
}
