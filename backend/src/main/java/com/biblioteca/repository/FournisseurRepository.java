package com.biblioteca.repository;

import com.biblioteca.entity.Fournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {

  @Query("SELECT f FROM Fournisseur f WHERE f.actif = true AND " +
         "(:q IS NULL OR LOWER(f.nom) LIKE LOWER(CONCAT('%',:q,'%')) " +
         "OR LOWER(f.email) LIKE LOWER(CONCAT('%',:q,'%')))")
  Page<Fournisseur> search(@Param("q") String q, Pageable pageable);

  Page<Fournisseur> findByActifTrueOrderByNomAsc(Pageable pageable);
}
