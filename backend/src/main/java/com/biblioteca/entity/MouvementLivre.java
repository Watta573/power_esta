package com.biblioteca.entity;

import com.biblioteca.entity.enums.TypeMouvementLivre;
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
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mouvements_livre")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MouvementLivre {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "exemplaire_id", nullable = false)
  private Exemplaire exemplaire;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private TypeMouvementLivre type;

  @Column(nullable = false)
  private LocalDateTime dateHeure;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  void prePersist() {
    if (dateHeure == null) dateHeure = LocalDateTime.now();
  }
}

