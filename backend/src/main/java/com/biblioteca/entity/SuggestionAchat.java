package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "suggestions_achat")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SuggestionAchat {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String titre;

  @Column(length = 180)
  private String auteur;

  @Column(length = 20)
  private String isbn;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "demandeur_id")
  private Utilisateur demandeur;

  @Column(columnDefinition = "TEXT")
  private String justification;

  @Column(nullable = false, length = 20)
  private String statut; // EN_ATTENTE, APPROUVE, REJETE

  @Column(name = "date_demande", nullable = false)
  private LocalDateTime dateDemande;

  @Column(name = "date_traitement")
  private LocalDateTime dateTraitement;

  @PrePersist
  void prePersist() {
    if (dateDemande == null) dateDemande = LocalDateTime.now();
    if (statut == null) statut = "EN_ATTENTE";
  }
}
