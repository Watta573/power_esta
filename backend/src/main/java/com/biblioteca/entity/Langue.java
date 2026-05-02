package com.biblioteca.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "langues")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Langue {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 80)
  private String nom;
}
