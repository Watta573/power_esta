package com.biblioteca.repository;

import com.biblioteca.entity.Periodique;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PeriodiqueRepository extends JpaRepository<Periodique, Long> {

  @Query("SELECT p FROM Periodique p WHERE p.actif = true AND " +
         "(:q IS NULL OR LOWER(p.titre) LIKE LOWER(CONCAT('%',:q,'%')) " +
         "OR LOWER(p.issn) LIKE LOWER(CONCAT('%',:q,'%')) " +
         "OR LOWER(p.editeur) LIKE LOWER(CONCAT('%',:q,'%')))")
  Page<Periodique> search(@Param("q") String q, Pageable pageable);

  Page<Periodique> findByActifTrueOrderByTitreAsc(Pageable pageable);
}
