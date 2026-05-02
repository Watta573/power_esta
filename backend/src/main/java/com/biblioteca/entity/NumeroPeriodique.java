package com.biblioteca.entity;

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

  @Column(nullable = false)
  private Boolean disponible;

  @Column(length = 100)
  private String localisation;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  void prePersist() {
    if (disponible == null) disponible = true;
  }
}
