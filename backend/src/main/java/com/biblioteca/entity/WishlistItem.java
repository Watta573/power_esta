package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "wishlist_items",
       uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "livre_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class WishlistItem {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "livre_id", nullable = false)
  private Livre livre;

  @Column(nullable = false)
  private LocalDateTime dateAjout;

  @PrePersist
  void pre() { if (dateAjout == null) dateAjout = LocalDateTime.now(); }
}
