package com.biblioteca.entity;

import com.biblioteca.entity.enums.EtatExemplaire;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "exemplaires")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exemplaire {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "livre_id", nullable = false)
  private Livre livre;

  @Column(nullable = false, unique = true, length = 40)
  private String codeExemplaire;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private EtatExemplaire etat;

  @Column(nullable = false)
  private Boolean disponible;

  @Column(length = 120)
  private String localisation;

  @PrePersist
  void prePersist() {
    if (disponible == null) disponible = true;
    if (etat == null) etat = EtatExemplaire.BON;
  }
}

