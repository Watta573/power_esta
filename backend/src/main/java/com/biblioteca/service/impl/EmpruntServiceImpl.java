package com.biblioteca.service.impl;

import com.biblioteca.entity.Emprunt;
import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.entity.enums.TypeNotification;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.ExemplaireRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.EmpruntService;
import com.biblioteca.service.ReservationService;
import org.springframework.context.annotation.Lazy;
import com.biblioteca.service.NotificationService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpruntServiceImpl implements EmpruntService {
  private final EmpruntRepository empruntRepository;
  private final UtilisateurRepository utilisateurRepository;
  private final ExemplaireRepository exemplaireRepository;
  private final NotificationService notificationService;
  private final ReservationService reservationService;

  @Value("${bibliotheque.amende.tarif-journalier:100}")
  private BigDecimal tarifJournalier;
  @Value("${bibliotheque.emprunt.duree-etudiant:14}")
  private int dureeEtudiant;
  @Value("${bibliotheque.emprunt.duree-enseignant:21}")
  private int dureeEnseignant;
  @Value("${bibliotheque.emprunt.duree-public:7}")
  private int dureePublic;
  @Value("${bibliotheque.emprunt.quota-etudiant:3}")
  private int quotaEtudiant;
  @Value("${bibliotheque.emprunt.quota-enseignant:5}")
  private int quotaEnseignant;
  @Value("${bibliotheque.emprunt.quota-public:1}")
  private int quotaPublic;

  public EmpruntServiceImpl(EmpruntRepository empruntRepository,
                            UtilisateurRepository utilisateurRepository,
                            ExemplaireRepository exemplaireRepository,
                            NotificationService notificationService,
                            @Lazy ReservationService reservationService) {
    this.empruntRepository = empruntRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.exemplaireRepository = exemplaireRepository;
    this.notificationService = notificationService;
    this.reservationService = reservationService;
  }

  @Override
  @Transactional
  public Emprunt creerEmprunt(Long utilisateurId, Long exemplaireId) {
    Utilisateur user = utilisateurRepository.findById(utilisateurId)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    Exemplaire ex = exemplaireRepository.findById(exemplaireId)
        .orElseThrow(() -> new BusinessException("Exemplaire introuvable"));
    if (!Boolean.TRUE.equals(ex.getDisponible())) throw new BusinessException("Exemplaire indisponible");
    if (empruntRepository.existsByUtilisateurIdAndStatut(utilisateurId, StatutEmprunt.EN_RETARD)) {
      throw new BusinessException("Utilisateur bloque: retard existant");
    }
    long enCours = empruntRepository.countByUtilisateurIdAndStatut(utilisateurId, StatutEmprunt.EN_COURS);
    if (enCours >= quota(user.getRole())) throw new BusinessException("Quota emprunts depasse");

    LocalDate now = LocalDate.now();
    Emprunt e = Emprunt.builder()
        .utilisateur(user)
        .exemplaire(ex)
        .dateEmprunt(now)
        .dateRetourPrevue(now.plusDays(duree(user.getRole())))
        .statut(StatutEmprunt.EN_COURS)
        .nombreRenouvellements(0)
        .amende(BigDecimal.ZERO)
        .build();
    ex.setDisponible(false);
    exemplaireRepository.save(ex);
    Emprunt saved = empruntRepository.save(e);
    notificationService.envoyerEmailEmprunt(
        user,
        ex.getLivre().getTitre(),
        now.plusDays(duree(user.getRole())).toString()
    );
    return saved;
  }

  @Override
  @Transactional
  public Emprunt enregistrerRetour(Long empruntId) {
    Emprunt e = empruntRepository.findById(empruntId).orElseThrow(() -> new BusinessException("Emprunt introuvable"));
    e.setDateRetourEffective(LocalDate.now());
    BigDecimal amende = calculerAmende(empruntId);
    e.setAmende(amende);
    e.setStatut(StatutEmprunt.RETOURNE);
    Exemplaire ex = e.getExemplaire();
    ex.setDisponible(true);
    exemplaireRepository.save(ex);
    Emprunt saved = empruntRepository.save(e);
    notificationService.envoyerEmailRetourConfirme(e.getUtilisateur(), e.getExemplaire().getLivre().getTitre());
    if (amende.compareTo(BigDecimal.ZERO) > 0) {
      notificationService.notifier(e.getUtilisateur(), TypeNotification.AMENDE_GENEREE,
          "Amende generee: " + amende + " FCFA", CanalNotification.INTERNE);
      notificationService.envoyerEmailAmende(
          e.getUtilisateur(),
          e.getExemplaire().getLivre().getTitre(),
          amende.doubleValue());
    }
    // Notifier le prochain en file d'attente si réservation existe
    reservationService.notifierProchainEnAttente(ex.getLivre().getId());
    return saved;
  }

  @Override
  @Transactional
  public Emprunt renouvelerEmprunt(Long empruntId) {
    Emprunt e = empruntRepository.findById(empruntId).orElseThrow(() -> new BusinessException("Emprunt introuvable"));
    if (e.getNombreRenouvellements() >= 1) throw new BusinessException("Renouvellement max atteint");
    if (e.getStatut() != StatutEmprunt.EN_COURS) throw new BusinessException("Renouvellement impossible");
    
    LocalDate nouvelleDateRetour = e.getDateRetourPrevue().plusDays(duree(e.getUtilisateur().getRole()));
    e.setDateRetourPrevue(nouvelleDateRetour);
    e.setNombreRenouvellements(e.getNombreRenouvellements() + 1);
    
    Emprunt saved = empruntRepository.save(e);
    
    // Envoyer notification par email
    notificationService.envoyerEmailEmpruntProlonge(
        e.getUtilisateur(),
        e.getExemplaire().getLivre().getTitre(),
        nouvelleDateRetour.toString()
    );
    
    return saved;
  }

  @Override
  @Transactional
  public Emprunt payerAmende(Long empruntId) {
    Emprunt e = empruntRepository.findById(empruntId)
        .orElseThrow(() -> new BusinessException("Emprunt introuvable"));
    if (e.getStatut() != StatutEmprunt.EN_RETARD) {
      throw new BusinessException("Cet emprunt n'a pas d'amende en cours");
    }
    e.setAmende(java.math.BigDecimal.ZERO);
    e.setStatut(StatutEmprunt.EN_COURS);
    return empruntRepository.save(e);
  }

  @Override
  @Transactional(readOnly = true)
  public BigDecimal calculerAmende(Long empruntId) {
    Emprunt e = empruntRepository.findById(empruntId).orElseThrow(() -> new BusinessException("Emprunt introuvable"));
    LocalDate reference = e.getDateRetourEffective() == null ? LocalDate.now() : e.getDateRetourEffective();
    long days = ChronoUnit.DAYS.between(e.getDateRetourPrevue(), reference);
    if (days <= 0) return BigDecimal.ZERO;
    return tarifJournalier.multiply(BigDecimal.valueOf(days));
  }

  @Override
  @Transactional(readOnly = true)
  public List<Emprunt> getEmpruntsEnRetard() {
    return empruntRepository.findByStatutIn(List.of(StatutEmprunt.EN_RETARD));
  }

  @Override
  @Transactional(readOnly = true)
  public List<Emprunt> getEmpruntsUtilisateur(Long utilisateurId) {
    return empruntRepository.findByUtilisateurIdOrderByDateEmpruntDesc(utilisateurId);
  }

  @Scheduled(cron = "0 0 8 * * *")
  @Transactional
  public void detecterRetardsEtRappeler() {
    LocalDate today = LocalDate.now();

    // Rappel J-3
    LocalDate dans3jours = today.plusDays(3);
    List<Emprunt> rappels = empruntRepository.findByDateRetourPrevueAndStatut(dans3jours, StatutEmprunt.EN_COURS);
    for (Emprunt e : rappels) {
      if (Boolean.TRUE.equals(e.getUtilisateur().getNotifEmailRappelRetour())) {
        notificationService.notifier(e.getUtilisateur(), TypeNotification.RAPPEL_RETOUR,
            "Rappel : retour de \"" + e.getExemplaire().getLivre().getTitre() + "\" dans 3 jours", CanalNotification.INTERNE);
        notificationService.envoyerEmail(
            e.getUtilisateur().getEmail(),
            "\uD83D\uDD14 Rappel retour dans 3 jours \u2014 " + e.getExemplaire().getLivre().getTitre(),
            buildRappelHtml(e)
        );
      }
    }

    // Détection retards
    List<Emprunt> retards = empruntRepository.findByDateRetourPrevueBeforeAndStatut(today, StatutEmprunt.EN_COURS);
    for (Emprunt e : retards) {
      e.setStatut(StatutEmprunt.EN_RETARD);
      empruntRepository.save(e);
      notificationService.notifier(e.getUtilisateur(), TypeNotification.RETARD_CONSTATE,
          "Emprunt en retard pour " + e.getExemplaire().getCodeExemplaire(), CanalNotification.INTERNE);
      notificationService.envoyerEmailRetard(
          e.getUtilisateur(),
          e.getExemplaire().getLivre().getTitre(),
          java.time.temporal.ChronoUnit.DAYS.between(e.getDateRetourPrevue(), today)
      );
    }
  }

  private String buildRappelHtml(Emprunt e) {
    return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f3f4f6;padding:40px 0;'>"
        + "<table width='600' style='background:#fff;border-radius:12px;margin:auto;padding:32px;'>"
        + "<tr><td style='background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:24px;border-radius:8px 8px 0 0;text-align:center;'>"
        + "<h1 style='color:#fff;margin:0;font-size:20px;'>Biblioth\u00e8que ESTA</h1></td></tr>"
        + "<tr><td style='padding:24px;'>"
        + "<h2 style='color:#1B4332;'>Rappel de retour</h2>"
        + "<p>Bonjour <strong>" + e.getUtilisateur().getPrenom() + " " + e.getUtilisateur().getNom() + "</strong>,</p>"
        + "<p>Votre emprunt arrive \u00e0 échéance dans <strong>3 jours</strong>.</p>"
        + "<div style='background:#fefce8;border-left:4px solid #eab308;padding:16px;border-radius:8px;margin:16px 0;'>"
        + "<p style='margin:0;'>\uD83D\uDCDA Livre : <strong>" + e.getExemplaire().getLivre().getTitre() + "</strong></p>"
        + "<p style='margin:8px 0 0;'>\uD83D\uDCC5 Date de retour : <strong>" + e.getDateRetourPrevue() + "</strong></p>"
        + "</div>"
        + "<p>Merci de retourner ce document avant la date prévue.</p>"
        + "</td></tr></table></body></html>";
  }

  private int duree(Role role) {
    return switch (role) {
      case ETUDIANT -> dureeEtudiant;
      case ENSEIGNANT -> dureeEnseignant;
      case PUBLIC -> dureePublic;
      default -> dureeEtudiant;
    };
  }

  private int quota(Role role) {
    return switch (role) {
      case ETUDIANT -> quotaEtudiant;
      case ENSEIGNANT -> quotaEnseignant;
      case PUBLIC -> quotaPublic;
      default -> quotaEnseignant;
    };
  }
}

