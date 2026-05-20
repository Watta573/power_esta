package com.biblioteca.repository;

import com.biblioteca.entity.EmpruntPeriodique;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmpruntPeriodiqueRepository extends JpaRepository<EmpruntPeriodique, Long> {
  Page<EmpruntPeriodique> findByUtilisateurId(Long utilisateurId, Pageable pageable);
  Page<EmpruntPeriodique> findByStatut(String statut, Pageable pageable);
  Page<EmpruntPeriodique> findByUtilisateurIdAndStatut(Long utilisateurId, String statut, Pageable pageable);
  List<EmpruntPeriodique> findByDateRetourPrevueBeforeAndStatut(LocalDate date, String statut);
  boolean existsByUtilisateurIdAndStatut(Long utilisateurId, String statut);
  long countByUtilisateurIdAndStatut(Long utilisateurId, String statut);

  @Query("select e from EmpruntPeriodique e where (:uid is null or e.utilisateur.id = :uid) and (:statut is null or e.statut = :statut) order by e.dateEmprunt desc")
  Page<EmpruntPeriodique> findFiltered(@Param("uid") Long uid, @Param("statut") String statut, Pageable pageable);
}
