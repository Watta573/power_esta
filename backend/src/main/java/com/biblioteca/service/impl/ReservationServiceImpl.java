package com.biblioteca.service.impl;

import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Reservation;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.StatutReservation;
import com.biblioteca.entity.enums.TypeNotification;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.ExemplaireRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.ReservationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.EmpruntService;
import com.biblioteca.service.LivreService;
import com.biblioteca.service.NotificationService;
import com.biblioteca.service.ReservationService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationServiceImpl implements ReservationService {
  private final ReservationRepository reservationRepository;
  private final UtilisateurRepository utilisateurRepository;
  private final LivreRepository livreRepository;
  private final LivreService livreService;
  private final EmpruntService empruntService;
  private final NotificationService notificationService;

  @Value("${bibliotheque.reservation.duree-validite:3}")
  private int dureeValidite;

  public ReservationServiceImpl(ReservationRepository reservationRepository,
                                UtilisateurRepository utilisateurRepository,
                                LivreRepository livreRepository,
                                LivreService livreService,
                                EmpruntService empruntService,
                                NotificationService notificationService) {
    this.reservationRepository = reservationRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.livreRepository = livreRepository;
    this.livreService = livreService;
    this.empruntService = empruntService;
    this.notificationService = notificationService;
  }

  @Override
  @Transactional
  public Reservation creerReservation(Long utilisateurId, Long livreId) {
    Utilisateur u = utilisateurRepository.findById(utilisateurId).orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    Livre l = livreRepository.findById(livreId).orElseThrow(() -> new BusinessException("Livre introuvable"));
    if (livreService.obtenirNombreExemplairesDisponibles(livreId) > 0) throw new BusinessException("Livre disponible: pas de reservation");
    long n = reservationRepository.countByUtilisateurIdAndStatutIn(utilisateurId, List.of(StatutReservation.EN_ATTENTE, StatutReservation.DISPONIBLE));
    if (n >= 3) throw new BusinessException("Max 3 reservations simultanees");
    int pos = reservationRepository.findByLivreIdAndStatutOrderByPositionAsc(livreId, StatutReservation.EN_ATTENTE).size() + 1;
    Reservation r = Reservation.builder()
        .utilisateur(u)
        .livre(l)
        .position(pos)
        .dateExpiration(LocalDate.now().plusDays(dureeValidite))
        .statut(StatutReservation.EN_ATTENTE)
        .notifie(false)
        .build();
    Reservation saved = reservationRepository.save(r);
    notificationService.envoyerEmailReservationCreee(u, l.getTitre(), pos);
    return saved;
  }

  @Override
  @Transactional
  public void notifierProchainEnAttente(Long livreId) {
    reservationRepository.findFirstByLivreIdAndStatutOrderByPositionAsc(livreId, StatutReservation.EN_ATTENTE).ifPresent(r -> {
      r.setStatut(StatutReservation.DISPONIBLE);
      r.setNotifie(true);
      r.setDateExpiration(LocalDate.now().plusDays(dureeValidite));
      reservationRepository.save(r);
      notificationService.notifier(r.getUtilisateur(), TypeNotification.LIVRE_DISPONIBLE,
          "Votre reservation est disponible: " + r.getLivre().getTitre(), CanalNotification.INTERNE);
      notificationService.envoyerEmailLivreDisponible(
          r.getUtilisateur(), r.getLivre().getTitre());
    });
  }

  @Override
  @Scheduled(cron = "0 0 * * * *")
  @Transactional
  public void verifierExpiration() {
    List<Reservation> expirables = reservationRepository.findByDateExpirationBeforeAndStatutIn(
        LocalDate.now(), List.of(StatutReservation.DISPONIBLE, StatutReservation.EN_ATTENTE));
    for (Reservation r : expirables) {
      boolean etaitDisponible = r.getStatut() == StatutReservation.DISPONIBLE;
      r.setStatut(StatutReservation.EXPIREE);
      reservationRepository.save(r);
      notificationService.notifier(r.getUtilisateur(), TypeNotification.RESERVATION_EXPIREE,
          "Votre réservation pour \"" + r.getLivre().getTitre() + "\" a expiré.", CanalNotification.INTERNE);
      notificationService.envoyerEmailReservationExpiree(r.getUtilisateur(), r.getLivre().getTitre());
      if (etaitDisponible) notifierProchainEnAttente(r.getLivre().getId());
    }
  }

  @Override
  @Transactional(readOnly = true)
  public int getPositionEnFile(Long reservationId) {
    Reservation r = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException("Reservation introuvable"));
    return r.getPosition();
  }

  @Override
  @Transactional
  public Reservation confirmerReservation(Long reservationId) {
    Reservation r = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException("Reservation introuvable"));
    if (r.getStatut() != StatutReservation.DISPONIBLE) throw new BusinessException("Reservation non disponible");
    r.setStatut(StatutReservation.CONFIRMEE);
    reservationRepository.save(r);
    var ex = livreService.obtenirProchainExemplaireDisponible(r.getLivre().getId());
    empruntService.creerEmprunt(r.getUtilisateur().getId(), ex.getId());
    return r;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Reservation> getReservationsUtilisateur(Long utilisateurId) {
    return reservationRepository.findByUtilisateurIdOrderByDateReservationDesc(utilisateurId);
  }

  @Override
  @Transactional(readOnly = true)
  public List<Reservation> getToutesReservations() {
    return reservationRepository.findAll();
  }

  @Override
  @Transactional
  public void annuler(Long reservationId) {
    Reservation r = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException("Reservation introuvable"));
    if (r.getStatut() == StatutReservation.EN_ATTENTE || r.getStatut() == StatutReservation.DISPONIBLE) {
      Long livreId = r.getLivre().getId();
      boolean etaitDisponible = r.getStatut() == StatutReservation.DISPONIBLE;
      r.setStatut(StatutReservation.ANNULEE);
      reservationRepository.save(r);
      notificationService.notifier(r.getUtilisateur(), TypeNotification.RESERVATION_CREEE,
          "Votre réservation pour \"" + r.getLivre().getTitre() + "\" a été annulée.", CanalNotification.INTERNE);
      notificationService.envoyerEmailReservationAnnulee(r.getUtilisateur(), r.getLivre().getTitre());
      if (etaitDisponible) notifierProchainEnAttente(livreId);
    } else {
      throw new BusinessException("Annulation non autorisee");
    }
  }

  @Override
  @Transactional
  public void supprimer(Long reservationId) {
    Reservation r = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException("Reservation introuvable"));
    if (r.getStatut() == StatutReservation.EN_ATTENTE || r.getStatut() == StatutReservation.DISPONIBLE) {
      throw new BusinessException("Impossible de supprimer une réservation active. Annulez-la d'abord.");
    }
    reservationRepository.delete(r);
  }

  @Override
  @Transactional
  public Reservation relancer(Long reservationId) {
    Reservation ancienne = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException("Reservation introuvable"));
    if (ancienne.getStatut() != StatutReservation.EXPIREE && ancienne.getStatut() != StatutReservation.ANNULEE) {
      throw new BusinessException("Relance possible uniquement pour une réservation expirée ou annulée");
    }
    return creerReservation(ancienne.getUtilisateur().getId(), ancienne.getLivre().getId());
  }
}

