package com.biblioteca.entity;

import com.biblioteca.entity.enums.StatutNumeroPeriodique;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(name = "numeros_periodique")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class NumeroPeriodique {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "periodique_id", nullable = false)
  private Periodique periodique;

  @Column(length = 20)
  private String volume;

  @Column(nullable = false, length = 20)
  private String numero;

  @Column(name = "date_parution", nullable = false)
  private LocalDate dateParution;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private StatutNumeroPeriodique statut;

  @Column(nullable = false)
  private Boolean disponible;

  @Column(name = "date_reception")
  private LocalDate dateReception;

  @Column(length = 100)
  private String localisation;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  void prePersist() {
    if (statut == null) statut = StatutNumeroPeriodique.ATTENDU;
    if (disponible == null) disponible = statut != StatutNumeroPeriodique.ATTENDU;
  }
}
