package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(name = "fournisseurs")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Fournisseur {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 180)
  private String nom;

  @Column(length = 180)
  private String email;

  @Column(length = 30)
  private String telephone;

  @Column(length = 255)
  private String adresse;

  @Column(name = "contact_nom", length = 120)
  private String contactNom;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(nullable = false)
  private Boolean actif;

  @Column(name = "date_creation", nullable = false)
  private LocalDate dateCreation;

  @PrePersist
  void prePersist() {
    if (actif == null) actif = true;
    if (dateCreation == null) dateCreation = LocalDate.now();
  }
}
