package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "alertes_thematiques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AlerteThematique {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  // "CATEGORIE" ou "AUTEUR"
  @Column(nullable = false, length = 20)
  private String typeAlerte;

  // Valeur : nom de la catégorie ou nom de l'auteur
  @Column(nullable = false, length = 200)
  private String valeur;

  @Column(nullable = false)
  private LocalDateTime dateCreation;

  @PrePersist
  void pre() { if (dateCreation == null) dateCreation = LocalDateTime.now(); }
}
