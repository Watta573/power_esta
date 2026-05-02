package com.biblioteca.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "statistiques_circulation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatistiquesCirculation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "date_stat", nullable = false, unique = true)
    private LocalDate dateStat;
    
    @Column(name = "nb_emprunts")
    private Integer nbEmprunts = 0;
    
    @Column(name = "nb_retours")
    private Integer nbRetours = 0;
    
    @Column(name = "nb_reservations")
    private Integer nbReservations = 0;
    
    @Column(name = "nb_nouveaux_lecteurs")
    private Integer nbNouveauxLecteurs = 0;
    
    @Column(name = "montant_amendes", precision = 10, scale = 2)
    private BigDecimal montantAmendes = BigDecimal.ZERO;
    
    @Column(name = "donnees_detaillees", columnDefinition = "jsonb")
    private String donneesDetailees;
    
    @Column(name = "date_creation")
    private LocalDateTime dateCreation = LocalDateTime.now();
}