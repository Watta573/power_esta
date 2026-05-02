package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "avis_livres",
       uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "livre_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AvisLivre {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "livre_id", nullable = false)
  private Livre livre;

  @Column(nullable = false)
  private int note; // 1-5

  @Column(length = 1000)
  private String commentaire;

  @Column(nullable = false)
  private LocalDateTime dateAvis;

  @PrePersist
  void pre() { if (dateAvis == null) dateAvis = LocalDateTime.now(); }
}
