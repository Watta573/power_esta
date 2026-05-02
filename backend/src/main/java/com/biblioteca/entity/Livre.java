package com.biblioteca.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "livres")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Livre {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String titre;

  @Column(nullable = false, unique = true, length = 20)
  private String isbn;

  @Column(nullable = false, length = 180)
  private String auteur;

  @Column(length = 180)
  private String editeur;

  @Column(length = 50)
  private String edition;

  private Integer anneePublication;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "categorie_id", nullable = false)
  private Categorie categorie;

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
    name = "livre_langues",
    joinColumns = @JoinColumn(name = "livre_id"),
    inverseJoinColumns = @JoinColumn(name = "langue_id")
  )
  private List<Langue> langues;

  // Compatibilité rétrograde — retourne la première langue comme string
  public String getLangue() {
    if (langues == null || langues.isEmpty()) return null;
    return langues.stream().map(Langue::getNom).reduce((a, b) -> a + ", " + b).orElse(null);
  }

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(length = 255)
  private String couverture;

  private Integer nombrePages;

  @Column(nullable = false)
  private LocalDate dateAjout;

  @Column(nullable = false)
  private Boolean actif;

  @PrePersist
  void prePersist() {
    if (dateAjout == null) dateAjout = LocalDate.now();
    if (actif == null) actif = true;
  }
}

