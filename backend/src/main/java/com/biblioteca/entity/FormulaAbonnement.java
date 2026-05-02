package com.biblioteca.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "formulas_abonnement")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FormulaAbonnement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prix;

    @Column(nullable = false)
    private Integer dureeMois;

    @Column(nullable = false)
    private Integer maxEmpruntsSimultanes;

    @Column(nullable = false)
    private Boolean actif = true;

    private String couleur;

    private Integer ordre;
}
