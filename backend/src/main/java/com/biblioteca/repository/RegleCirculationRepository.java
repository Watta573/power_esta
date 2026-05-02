package com.biblioteca.repository;

import com.biblioteca.entity.RegleCirculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegleCirculationRepository extends JpaRepository<RegleCirculation, Long> {
    
    Optional<RegleCirculation> findByTypeUtilisateurAndTypeDocumentAndActifTrue(
            String typeUtilisateur, String typeDocument);
    
    List<RegleCirculation> findByActifTrueOrderByTypeUtilisateurAscTypeDocumentAsc();
    
    @Query("SELECT r FROM RegleCirculation r WHERE r.actif = true AND " +
           "(r.dateDebut IS NULL OR r.dateDebut <= :date) AND " +
           "(r.dateFin IS NULL OR r.dateFin >= :date)")
    List<RegleCirculation> findReglesActivesALaDate(@Param("date") LocalDate date);
}