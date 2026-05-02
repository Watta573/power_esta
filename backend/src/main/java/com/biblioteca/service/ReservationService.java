package com.biblioteca.service;

import com.biblioteca.entity.Reservation;
import java.util.List;

public interface ReservationService {
  Reservation creerReservation(Long utilisateurId, Long livreId);

  void notifierProchainEnAttente(Long livreId);

  void verifierExpiration();

  int getPositionEnFile(Long reservationId);

  Reservation confirmerReservation(Long reservationId);

  List<Reservation> getReservationsUtilisateur(Long utilisateurId);

  List<Reservation> getToutesReservations();

  void annuler(Long reservationId);

  void supprimer(Long reservationId);

  Reservation relancer(Long reservationId);
}

