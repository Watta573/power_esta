package com.biblioteca.repository;

import com.biblioteca.entity.StatistiquesCirculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StatistiquesCirculationRepository extends JpaRepository<StatistiquesCirculation, Long> {
    
    Optional<StatistiquesCirculation> findByDateStat(LocalDate dateStat);
    
    List<StatistiquesCirculation> findByDateStatBetweenOrderByDateStatAsc(
            LocalDate dateDebut, LocalDate dateFin);
    
    @Query("SELECT s FROM StatistiquesCirculation s WHERE s.dateStat >= :dateDebut ORDER BY s.dateStat DESC")
    List<StatistiquesCirculation> findStatistiquesDepuis(@Param("dateDebut") LocalDate dateDebut);
    
    @Query("SELECT SUM(s.nbEmprunts) FROM StatistiquesCirculation s WHERE s.dateStat BETWEEN :debut AND :fin")
    Long sumEmpruntsParPeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    
    @Query("SELECT SUM(s.montantAmendes) FROM StatistiquesCirculation s WHERE s.dateStat BETWEEN :debut AND :fin")
    java.math.BigDecimal sumAmendesParPeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}