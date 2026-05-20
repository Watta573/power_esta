package com.biblioteca.repository;

import com.biblioteca.entity.ReservationPeriodique;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationPeriodiqueRepository extends JpaRepository<ReservationPeriodique, Long> {
  Page<ReservationPeriodique> findByUtilisateurId(Long utilisateurId, Pageable pageable);
  Page<ReservationPeriodique> findByStatut(String statut, Pageable pageable);
  Page<ReservationPeriodique> findByUtilisateurIdAndStatut(Long utilisateurId, String statut, Pageable pageable);
  boolean existsByNumeroIdAndUtilisateurIdAndStatutIn(Long numeroId, Long utilisateurId, List<String> statuts);
  List<ReservationPeriodique> findByNumeroIdAndStatutOrderByDateReservationAsc(Long numeroId, String statut);
  List<ReservationPeriodique> findByDateExpirationBeforeAndStatutIn(LocalDate date, List<String> statuts);
}
