package com.biblioteca.entity;

import com.biblioteca.entity.enums.TypePeriodique;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(name = "periodiques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Periodique {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String titre;

  @Column(unique = true, length = 20)
  private String issn;

  @Column(length = 180)
  private String editeur;

  @Column(length = 80)
  private String langue;

  /** Fréquence : QUOTIDIEN, HEBDOMADAIRE, MENSUEL, TRIMESTRIEL, ANNUEL */
  @Column(length = 30)
  private String frequence;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(length = 255)
  private String couverture;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private TypePeriodique type;

  @Column(name = "acces_numerique", length = 255)
  private String accesNumerique;

  @Column(name = "licence_acces", length = 255)
  private String licenceAcces;

  @Column(nullable = false)
  private Boolean actif;

  @Column(name = "date_ajout", nullable = false)
  private LocalDate dateAjout;

  @PrePersist
  void prePersist() {
    if (type == null) type = TypePeriodique.PHYSIQUE;
    if (actif == null) actif = true;
    if (dateAjout == null) dateAjout = LocalDate.now();
  }
}
