package com.biblioteca.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "regles_circulation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegleCirculation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String nom;
    
    @Column(name = "type_utilisateur", nullable = false, length = 50)
    private String typeUtilisateur; // ETUDIANT, ENSEIGNANT, PUBLIC
    
    @Column(name = "type_document", length = 50)
    private String typeDocument = "LIVRE"; // LIVRE, PERIODIQUE, DVD
    
    @Column(name = "duree_pret_jours", nullable = false)
    private Integer dureePretJours = 14;
    
    @Column(name = "nb_renouvellements_max")
    private Integer nbRenouvellements = 2;
    
    @Column(name = "nb_emprunts_max")
    private Integer nbEmpruntsMax = 5;
    
    @Column(name = "amende_par_jour", precision = 10, scale = 2)
    private BigDecimal amendeParJour = BigDecimal.valueOf(0.50);
    
    @Column(name = "amende_max", precision = 10, scale = 2)
    private BigDecimal amendeMax = BigDecimal.valueOf(50.00);
    
    @Builder.Default
    private Boolean actif = true;
    
    @Column(name = "date_debut")
    private LocalDate dateDebut = LocalDate.now();
    
    @Column(name = "date_fin")
    private LocalDate dateFin;
    
    @Column(name = "date_creation")
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    @Column(name = "date_modification")
    private LocalDateTime dateModification = LocalDateTime.now();
}