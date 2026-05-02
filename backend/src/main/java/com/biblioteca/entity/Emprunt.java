package com.biblioteca.entity;

import com.biblioteca.entity.enums.StatutEmprunt;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "emprunts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Emprunt {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "exemplaire_id", nullable = false)
  private Exemplaire exemplaire;

  @Column(nullable = false)
  private LocalDate dateEmprunt;

  @Column(nullable = false)
  private LocalDate dateRetourPrevue;

  private LocalDate dateRetourEffective;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private StatutEmprunt statut;

  @Column(nullable = false)
  private Integer nombreRenouvellements;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amende;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  void prePersist() {
    if (dateEmprunt == null) dateEmprunt = LocalDate.now();
    if (statut == null) statut = StatutEmprunt.EN_COURS;
    if (nombreRenouvellements == null) nombreRenouvellements = 0;
    if (amende == null) amende = BigDecimal.ZERO;
  }
}

