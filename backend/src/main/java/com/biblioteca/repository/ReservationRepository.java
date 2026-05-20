package com.biblioteca.repository;

import com.biblioteca.entity.Reservation;
import com.biblioteca.entity.enums.StatutReservation;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
  long countByUtilisateurIdAndStatutIn(Long utilisateurId, List<StatutReservation> statuts);

  long countByStatut(StatutReservation statut);

  List<Reservation> findByUtilisateurIdOrderByDateReservationDesc(Long utilisateurId);

  Page<Reservation> findByUtilisateurId(Long utilisateurId, Pageable pageable);

  Page<Reservation> findByStatut(StatutReservation statut, Pageable pageable);

  Page<Reservation> findByUtilisateurIdAndStatut(Long utilisateurId, StatutReservation statut, Pageable pageable);

  List<Reservation> findByLivreIdAndStatutOrderByPositionAsc(Long livreId, StatutReservation statut);

  Optional<Reservation> findFirstByLivreIdAndStatutOrderByPositionAsc(Long livreId, StatutReservation statut);

  long countByLivreIdAndStatut(Long livreId, StatutReservation statut);

  List<Reservation> findByDateExpirationBeforeAndStatut(LocalDate date, StatutReservation statut);

  List<Reservation> findByDateExpirationBeforeAndStatutIn(LocalDate date, List<StatutReservation> statuts);
}

