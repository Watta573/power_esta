package com.biblioteca.repository;

import com.biblioteca.entity.AbonnementPeriodique;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AbonnementPeriodiqueRepository extends JpaRepository<AbonnementPeriodique, Long> {
  Page<AbonnementPeriodique> findByPeriodiqueId(Long periodiqueId, Pageable pageable);
  Page<AbonnementPeriodique> findByStatut(String statut, Pageable pageable);
  List<AbonnementPeriodique> findByStatutAndDateFinBefore(String statut, LocalDate date);

  @Query("select a from AbonnementPeriodique a where (:statut is null or a.statut = :statut)")
  Page<AbonnementPeriodique> findAll(@Param("statut") String statut, Pageable pageable);
}
