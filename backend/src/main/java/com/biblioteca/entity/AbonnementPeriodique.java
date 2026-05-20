package com.biblioteca.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "abonnements_periodiques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AbonnementPeriodique {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "periodique_id", nullable = false)
  private Periodique periodique;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "fournisseur_id", nullable = false)
  private Fournisseur fournisseur;

  @Column(name = "date_debut", nullable = false)
  private LocalDate dateDebut;

  @Column(name = "date_fin", nullable = false)
  private LocalDate dateFin;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal montant;

  /** ACTIF, EXPIRE, ANNULE */
  @Column(nullable = false, length = 20)
  private String statut;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "date_creation")
  private LocalDateTime dateCreation;

  @PrePersist
  void prePersist() {
    if (statut == null) statut = "ACTIF";
    if (montant == null) montant = BigDecimal.ZERO;
    if (dateCreation == null) dateCreation = LocalDateTime.now();
  }
}
