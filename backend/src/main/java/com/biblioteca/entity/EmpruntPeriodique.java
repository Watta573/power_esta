package com.biblioteca.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "emprunts_periodiques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EmpruntPeriodique {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "numero_id", nullable = false)
  private NumeroPeriodique numero;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @Column(name = "date_emprunt", nullable = false)
  private LocalDate dateEmprunt;

  @Column(name = "date_retour_prevue", nullable = false)
  private LocalDate dateRetourPrevue;

  @Column(name = "date_retour_effective")
  private LocalDate dateRetourEffective;

  /** EN_COURS, RETOURNE, EN_RETARD */
  @Column(nullable = false, length = 20)
  private String statut;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amende;

  @Column(name = "amende_payee", nullable = false)
  private Boolean amendePayee;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "date_creation")
  private LocalDateTime dateCreation;

  @PrePersist
  void prePersist() {
    if (dateEmprunt == null) dateEmprunt = LocalDate.now();
    if (statut == null) statut = "EN_COURS";
    if (amende == null) amende = BigDecimal.ZERO;
    if (amendePayee == null) amendePayee = false;
    if (dateCreation == null) dateCreation = LocalDateTime.now();
  }
}
