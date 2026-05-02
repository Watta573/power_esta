package com.biblioteca.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "cotisations")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Cotisation {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal montant;

  @Column(name = "date_debut", nullable = false)
  private LocalDate dateDebut;

  @Column(name = "date_fin", nullable = false)
  private LocalDate dateFin;

  /** ACTIVE, EXPIREE, ANNULEE */
  @Column(nullable = false, length = 20)
  private String statut;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "date_paiement")
  private LocalDate datePaiement;

  @Column(name = "code_reservation", unique = true, length = 20)
  private String codeReservation;

  @PrePersist
  void prePersist() {
    if (statut == null) statut = "EN_ATTENTE";
    if (codeReservation == null) {
      codeReservation = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
  }
}
