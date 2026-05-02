package com.biblioteca.repository;

import com.biblioteca.entity.Cotisation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CotisationRepository extends JpaRepository<Cotisation, Long> {

  Page<Cotisation> findAllByOrderByDatePaiementDesc(Pageable pageable);

  Page<Cotisation> findByStatutOrderByDatePaiementDesc(String statut, Pageable pageable);

  Page<Cotisation> findByUtilisateurIdOrderByDatePaiementDesc(Long utilisateurId, Pageable pageable);

  Optional<Cotisation> findTopByUtilisateurIdAndStatutOrderByDateFinDesc(Long utilisateurId, String statut);

  Optional<Cotisation> findByCodeReservation(String codeReservation);

  @Query("SELECT COALESCE(SUM(c.montant), 0) FROM Cotisation c WHERE c.statut = 'ACTIVE'")
  BigDecimal sumMontantActives();

  @Query("SELECT COUNT(c) FROM Cotisation c WHERE c.statut = 'ACTIVE' AND c.dateFin >= :today")
  long countActives(@Param("today") LocalDate today);

  List<Cotisation> findByStatutAndDateFin(String statut, LocalDate dateFin);

  List<Cotisation> findByStatutAndDateDebutBefore(String statut, LocalDate dateDebut);
}
