package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table(name = "listes_lecture")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ListeLecture {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "enseignant_id", nullable = false)
  private Utilisateur enseignant;

  @Column(nullable = false, length = 200)
  private String titre;

  @Column(length = 500)
  private String description;

  // Cours associé (ex: "Algorithmique L2")
  @Column(length = 200)
  private String cours;

  @Column(nullable = false)
  private boolean publique;

  @Column(nullable = false)
  private LocalDateTime dateCreation;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "liste_lecture_livres",
             joinColumns = @JoinColumn(name = "liste_id"),
             inverseJoinColumns = @JoinColumn(name = "livre_id"))
  @Builder.Default
  private List<Livre> livres = new ArrayList<>();

  @PrePersist
  void pre() { if (dateCreation == null) dateCreation = LocalDateTime.now(); }
}
