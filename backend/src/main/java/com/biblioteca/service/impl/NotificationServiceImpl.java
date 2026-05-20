package com.biblioteca.service.impl;

import com.biblioteca.entity.DiffusionGroupee;
import com.biblioteca.entity.Notification;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.TypeNotification;
import com.biblioteca.repository.DiffusionGroupeeRepository;
import com.biblioteca.repository.NotificationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.NotificationService;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationServiceImpl implements NotificationService {

  private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

  private final NotificationRepository notificationRepository;
  private final UtilisateurRepository utilisateurRepository;
  private final DiffusionGroupeeRepository diffusionGroupeeRepository;
  private final JavaMailSender mailSender;

  @Value("${app.mail.from:elvisouattara16@gmail.com}")
  private String mailFrom;

  @Value("${app.mail.from-name:Biblioth\u00e8que ESTA}")
  private String mailFromName;

  public NotificationServiceImpl(NotificationRepository notificationRepository,
                                  UtilisateurRepository utilisateurRepository,
                                  DiffusionGroupeeRepository diffusionGroupeeRepository,
                                  JavaMailSender mailSender) {
    this.notificationRepository = notificationRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.diffusionGroupeeRepository = diffusionGroupeeRepository;
    this.mailSender = mailSender;
  }

  @Override
  @Transactional
  public Notification notifier(Utilisateur utilisateur, TypeNotification type,
                                String message, CanalNotification canal) {
    Notification n = Notification.builder()
        .utilisateur(utilisateur)
        .type(type)
        .message(message)
        .canal(canal)
        .lu(false)
        .build();
    return notificationRepository.save(n);
  }

  @Override
  @Async
  public void envoyerEmail(String destinataire, String sujet, String corps) {
    try {
      MimeMessage mime = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
      helper.setFrom(mailFrom, mailFromName);
      helper.setTo(destinataire);
      helper.setSubject(sujet);
      helper.setText(corps, true);
      mailSender.send(mime);
      log.info("Email envoyé à {}: {}", destinataire, sujet);
    } catch (Exception e) {
      log.warn("Échec envoi email à {}: {}", destinataire, e.getMessage());
    }
  }

  @Override
  @Async
  public void envoyerEmailBienvenue(Utilisateur utilisateur) {
    String sujet = "Bienvenue à la Bibliothèque ESTA. Votre compte est créé";
    String html = buildEmailBienvenue(utilisateur);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.COMPTE_CREE,
        "Bienvenue " + utilisateur.getPrenom() + " ! Votre compte a été créé avec succès.",
        CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailEmprunt(Utilisateur utilisateur, String titreLivre, String dateRetour) {
    if (!Boolean.TRUE.equals(utilisateur.getNotifEmailEmprunt())) return;
    String sujet = "Emprunt confirmé " + titreLivre;
    String html = buildEmailEmprunt(utilisateur, titreLivre, dateRetour);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.EMPRUNT_CREE,
        "Emprunt enregistré : " + titreLivre + " —retour prévu le " + dateRetour, CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailRetourConfirme(Utilisateur utilisateur, String titreLivre) {
    if (!Boolean.TRUE.equals(utilisateur.getNotifEmailRetour())) return;
    String sujet = "Retour enregistré" + titreLivre;
    String html = buildEmailRetourConfirme(utilisateur, titreLivre);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.RETOUR_CONFIRME,
        "Retour enregistré : " + titreLivre, CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailReservationCreee(Utilisateur utilisateur, String titreLivre, int position) {
    if (!Boolean.TRUE.equals(utilisateur.getNotifEmailReservation())) return;
    String sujet = "Réservation confirmée" + titreLivre;
    String html = buildEmailReservation(utilisateur, titreLivre, position);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.RESERVATION_CREEE,
        "Réservation créée : " + titreLivre + " (position " + position + ")", CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailNouveauLivre(Utilisateur utilisateur, String titreLivre, String auteur, String categorie) {
    if (!Boolean.TRUE.equals(utilisateur.getNotifEmailNouveauLivre())) return;
    String sujet = "Nouveau livre disponible" + titreLivre;
    String html = buildEmailNouveauLivre(utilisateur, titreLivre, auteur, categorie);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.NOUVEAU_LIVRE,
        "Nouveau livre ajouté : " + titreLivre + " de " + auteur, CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailRetard(Utilisateur utilisateur, String titreLivre, long joursRetard) {
    String sujet = "Retard de retour" + titreLivre;
    String html = buildEmailRetard(utilisateur, titreLivre, joursRetard);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
  }

  @Override
  @Async
  public void envoyerEmailLivreDisponible(Utilisateur utilisateur, String titreLivre) {
    if (!Boolean.TRUE.equals(utilisateur.getNotifEmailLivreDisponible())) return;
    String sujet = "Votre réservation est disponible" + titreLivre;
    String html = buildEmailLivreDisponible(utilisateur, titreLivre);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
  }

  @Override
  @Async
  public void envoyerEmailAmende(Utilisateur utilisateur, String titreLivre, double montant) {
    String sujet = "Amende générée " + titreLivre;
    String html = buildEmailAmende(utilisateur, titreLivre, montant);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
  }

  @Override
  @Async
  public void envoyerEmailAmendePaye(Utilisateur utilisateur, String titreLivre, double montant) {
    String sujet = "Amende encaissée " + titreLivre;
    String html = baseTemplate("Amende encaissée",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + utilisateur.getPrenom() + " " + utilisateur.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Votre amende a bien été encaissée. Merci pour votre régularisation.</p>"
        + "<div style='background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Livre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#16a34a;font-weight:600;'>Montant payé : " + String.format("%.0f", montant) + " FCFA</p>"
        + "<p style='margin:8px 0 0;color:#16a34a;'>Amende réglée</p>"
        + "</div>"
        + "<p style='color:#374151;'>Vous pouvez à nouveau emprunter des documents. Bonne lecture !</p>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/emprunts' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir mes emprunts</a>"
        + "</div>");
    envoyerEmail(utilisateur.getEmail(), sujet, html);
  }

  @Override
  @Async
  public void envoyerEmailEmpruntProlonge(Utilisateur utilisateur, String titreLivre, String nouvelleDateRetour) {
    if (!Boolean.TRUE.equals(utilisateur.getNotifEmailEmprunt())) return;
    String sujet = "Emprunt prolongé " + titreLivre;
    String html = buildEmailEmpruntProlonge(utilisateur, titreLivre, nouvelleDateRetour);
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.EMPRUNT_CREE,
        "Emprunt prolongé : " + titreLivre + " nouvelle date de retour : " + nouvelleDateRetour, CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailReservationExpiree(Utilisateur utilisateur, String titreLivre) {
    String sujet = "Réservation expirée " + titreLivre;
    String html = baseTemplate("Réservation expirée",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + utilisateur.getPrenom() + " " + utilisateur.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Votre réservation pour le livre ci-dessous a expiré car vous n'avez pas confirmé dans le délai imparti.</p>"
        + "<div style='background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Livre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#dc2626;'> Réservation expirée</p>"
        + "</div>"
        + "<p style='color:#374151;'>Vous pouvez effectuer une nouvelle réservation si le livre est toujours indisponible.</p>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/livres' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir le catalogue</a>"
        + "</div>");
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.RESERVATION_EXPIREE,
        "Réservation expirée : " + titreLivre, CanalNotification.EMAIL);
  }

  @Override
  @Async
  public void envoyerEmailReservationAnnulee(Utilisateur utilisateur, String titreLivre) {
    String sujet = "Réservation annulée" + titreLivre;
    String html = baseTemplate("Réservation annulée",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + utilisateur.getPrenom() + " " + utilisateur.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Votre réservation pour le document ci-dessous a été annulée.</p>"
        + "<div style='background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Livre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#dc2626;'>Réservation annulée</p>"
        + "</div>"
        + "<p style='color:#374151;'>Vous pouvez effectuer une nouvelle réservation à tout moment depuis votre espace.</p>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/reservations' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir mes réservations</a>"
        + "</div>");
    envoyerEmail(utilisateur.getEmail(), sujet, html);
    notifier(utilisateur, TypeNotification.RESERVATION_EXPIREE,
        "Réservation annulée : " + titreLivre, CanalNotification.INTERNE);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Notification> listerUtilisateurPage(Long utilisateurId, Pageable pageable) {
    return notificationRepository.findByUtilisateurIdOrderByDateEnvoiDesc(utilisateurId, pageable);
  }

  @Override
  @Transactional(readOnly = true)
  public List<Notification> listerUtilisateur(Long utilisateurId) {
    return notificationRepository.findByUtilisateurIdOrderByDateEnvoiDesc(utilisateurId);
  }

  @Override
  @Transactional(readOnly = true)
  public long countNonLues(Long utilisateurId) {
    return notificationRepository.countByUtilisateurIdAndLuFalse(utilisateurId);
  }

  @Override
  @Transactional
  public void marquerCommeLu(Long id) {
    notificationRepository.findById(id).ifPresent(n -> {
      n.setLu(true);
      notificationRepository.save(n);
    });
  }

  @Override
  @Transactional
  public void marquerToutCommeLu(Long utilisateurId) {
    List<Notification> nonLues = notificationRepository
        .findByUtilisateurIdOrderByDateEnvoiDesc(utilisateurId)
        .stream().filter(n -> !Boolean.TRUE.equals(n.getLu())).toList();
    nonLues.forEach(n -> n.setLu(true));
    notificationRepository.saveAll(nonLues);
  }

  @Override
  @Transactional
  public void envoyerGroupee(List<String> roles, String sujet, String message, String type,
                              String dateEnvoiProgramme, Long expediteurId) {
    TypeNotification typeNotif;
    try {
      typeNotif = TypeNotification.valueOf(type);
    } catch (IllegalArgumentException e) {
      typeNotif = TypeNotification.NOUVEAU_LIVRE;
    }
    final TypeNotification finalType = typeNotif;

    List<Role> roleEnums = roles.stream()
        .map(r -> { try { return Role.valueOf(r); } catch (IllegalArgumentException ex) { return null; } })
        .filter(Objects::nonNull)
        .toList();

    // Envoi programmé : on persiste et on sort
    if (dateEnvoiProgramme != null && !dateEnvoiProgramme.isBlank()) {
      LocalDateTime dateProgrammee = LocalDateTime.parse(dateEnvoiProgramme,
          DateTimeFormatter.ISO_LOCAL_DATE_TIME);
      Utilisateur expediteur = expediteurId != null
          ? utilisateurRepository.findById(expediteurId).orElse(null) : null;
      int nbDestinataires = (int) utilisateurRepository.findAll().stream()
          .filter(u -> roleEnums.contains(u.getRole()) && Boolean.TRUE.equals(u.getActif()))
          .count();
      diffusionGroupeeRepository.save(DiffusionGroupee.builder()
          .expediteur(expediteur)
          .sujet(sujet)
          .message(message)
          .type(type)
          .rolesCibles(String.join(",", roles))
          .nbDestinataires(nbDestinataires)
          .statut("PLANIFIE")
          .dateEnvoiProgramme(dateProgrammee)
          .build());
      log.info("Diffusion groupée planifiée pour {} (rôles: {})", dateProgrammee, roles);
      return;
    }

    // Envoi immédiat
    List<Utilisateur> destinataires = utilisateurRepository.findAll().stream()
        .filter(u -> roleEnums.contains(u.getRole()) && Boolean.TRUE.equals(u.getActif()))
        .toList();

    destinataires.forEach(u -> {
      notifier(u, finalType, message, CanalNotification.INTERNE);
      envoyerEmail(u.getEmail(), sujet, buildEmailGroupee(u, message, finalType));
    });

    // Historique
    Utilisateur expediteur = expediteurId != null
        ? utilisateurRepository.findById(expediteurId).orElse(null) : null;
    diffusionGroupeeRepository.save(DiffusionGroupee.builder()
        .expediteur(expediteur)
        .sujet(sujet)
        .message(message)
        .type(type)
        .rolesCibles(String.join(",", roles))
        .nbDestinataires(destinataires.size())
        .statut("ENVOYE")
        .build());

    log.info("Diffusion groupée envoyée à {} utilisateurs (rôles: {})", destinataires.size(), roles);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DiffusionGroupee> getHistoriqueDiffusions(Pageable pageable) {
    return diffusionGroupeeRepository.findAllByOrderByDateEnvoiDesc(pageable);
  }

  @Override
  @Transactional
  @Scheduled(fixedDelay = 60_000) // toutes les minutes
  public int traiterDiffusionsProgrammees() {
    List<DiffusionGroupee> planifiees = diffusionGroupeeRepository
        .findByStatutAndDateEnvoiProgrammeBefore("PLANIFIE", LocalDateTime.now());
    for (DiffusionGroupee d : planifiees) {
      List<String> roles = List.of(d.getRolesCibles().split(","));
      envoyerGroupee(roles, d.getSujet(), d.getMessage(), d.getType(), null,
          d.getExpediteur() != null ? d.getExpediteur().getId() : null);
      d.setStatut("ENVOYE");
      diffusionGroupeeRepository.save(d);
    }
    if (!planifiees.isEmpty())
      log.info("{} diffusion(s) programmée(s) traitée(s)", planifiees.size());
    return planifiees.size();
  }

  private String buildSujetGroupee(TypeNotification type) {
    return switch (type) {
      case NOUVEAU_LIVRE    -> "Nouveau livre disponible. Bibliothèque ESTA";
      case RAPPEL_RETOUR    -> "Rappel de retour. Bibliothèque ESTA";
      case RETARD_CONSTATE  -> "Retard constaté. Bibliothèque ESTA";
      default               -> "Message de la Bibliothèque ESTA";
    };
  }

  private String buildEmailGroupee(Utilisateur u, String message, TypeNotification type) {
    String couleurBandeau = switch (type) {
      case RETARD_CONSTATE -> "#dc2626";
      case RAPPEL_RETOUR   -> "#d97706";
      default              -> "#1B4332";
    };
    String emoji = "";
    String contenu =
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>"
        + u.getPrenom() + " " + u.getNom() + "</strong>,</p>"
        + "<div style='background:#f8fafc;border-left:4px solid " + couleurBandeau + ";padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;font-size:15px;line-height:1.7;'>" + emoji + " " + message + "</p>"
        + "</div>"
        + "<p style='color:#6b7280;font-size:13px;margin-top:24px;'>Ce message a été envoyé par l’équipe de la Bibliothèque ESTA.</p>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/communication' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir mes notifications</a>"
        + "</div>";
    return baseTemplate("Message de la Bibliothèque", contenu);
  }

  // ─── Templates HTML ───────────────────────────────────────────────────────

  private String buildEmailEmprunt(Utilisateur u, String titreLivre, String dateRetour) {
    return baseTemplate("Emprunt enregistré",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + u.getPrenom() + " " + u.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Votre emprunt a été enregistré avec succès.</p>"
        + "<div style='background:#f0fdf4;border-left:4px solid #1B4332;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Livre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#374151;'>Date de retour prévue : <strong>" + dateRetour + "</strong></p>"
        + "</div>"
        + "<p style='color:#374151;'>Merci de retourner ce document avant la date prévue pour éviter toute amende.</p>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/emprunts' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir mes emprunts</a>"
        + "</div>");
  }

  private String buildEmailRetourConfirme(Utilisateur u, String titreLivre) {
    return baseTemplate("Retour enregistré",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + u.getPrenom() + " " + u.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Le retour du document suivant a bien été enregistré.</p>"
        + "<div style='background:#f0fdf4;border-left:4px solid #1B4332;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Livre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#16a34a;'>Retour confirmé</p>"
        + "</div>"
        + "<p style='color:#374151;'>Merci pour votre ponctualité. Vous pouvez emprunter de nouveaux documents.</p>");
  }

  private String buildEmailReservation(Utilisateur u, String titreLivre, int position) {
    return baseTemplate("Réservation confirmée",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + u.getPrenom() + " " + u.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Votre réservation a été enregistrée avec succès.</p>"
        + "<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Livre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#374151;'>Position dans la file : <strong>" + position + "</strong></p>"
        + "</div>"
        + "<p style='color:#374151;'>Vous serez notifié(e) par email dès qu'un exemplaire sera disponible.</p>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/reservations' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir mes réservations</a>"
        + "</div>");
  }

  private String buildEmailNouveauLivre(Utilisateur u, String titreLivre, String auteur, String categorie) {
    return baseTemplate("Nouveau livre disponible",
        "<p style='color:#374151;font-size:16px;line-height:1.6;'>Bonjour <strong>" + u.getPrenom() + " " + u.getNom() + "</strong>,</p>"
        + "<p style='color:#374151;'>Un nouveau document vient d'être ajouté au catalogue.</p>"
        + "<div style='background:#fefce8;border-left:4px solid #eab308;padding:16px;border-radius:8px;margin:20px 0;'>"
        + "<p style='margin:0;color:#374151;'>Titre : <strong>" + titreLivre + "</strong></p>"
        + "<p style='margin:8px 0 0;color:#374151;'>Auteur : <strong>" + auteur + "</strong></p>"
        + "<p style='margin:4px 0 0;color:#374151;'>Catégorie : <strong>" + categorie + "</strong></p>"
        + "</div>"
        + "<div style='text-align:center;margin:28px 0;'>"
        + "<a href='http://localhost:1420/livres' style='background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>Voir le catalogue</a>"
        + "</div>");
  }

  private String buildEmailBienvenue(Utilisateur u) {
    return baseTemplate(
        "Bienvenue, " + u.getPrenom() + " !",
        """
        <p style="color:#374151;font-size:16px;line-height:1.6;">
          Votre compte a été créé avec succès sur la plateforme de la
          <strong>Bibliothèque ESTA</strong>.
        </p>
        <div style="background:#f0fdf4;border-left:4px solid #1B4332;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#374151;"><strong>Vos informations de connexion :</strong></p>
          <p style="margin:8px 0 0;color:#374151;">Email : <strong>""" + u.getEmail() + """
          </strong></p>
          <p style="margin:4px 0 0;color:#374151;">Identifiant : <strong>""" + u.getIdentifiant() + """
          </strong></p>
          <p style="margin:4px 0 0;color:#374151;">Rôle : <strong>""" + u.getRole().name() + """
          </strong></p>
        </div>
        <p style="color:#374151;font-size:15px;">
          Vous pouvez dès maintenant vous connecter et explorer notre catalogue de livres,
          effectuer des emprunts et des réservations.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="http://localhost:1420/login"
             style="background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;
                    text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Se connecter
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px;">
          Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
        </p>
        """
    );
  }

  private String buildEmailRetard(Utilisateur u, String titreLivre, long joursRetard) {
    return baseTemplate(
        "Retard de retour détecté",
        """
        <p style="color:#374151;font-size:16px;line-height:1.6;">
          Bonjour <strong>""" + u.getPrenom() + " " + u.getNom() + """
          </strong>,
        </p>
        <p style="color:#374151;">
          Nous vous informons que votre emprunt du livre ci-dessous est en retard.
        </p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#374151;">Livre: <strong>""" + titreLivre + """
          </strong></p>
          <p style="margin:8px 0 0;color:#dc2626;">Retard : <strong>""" + joursRetard + """
           jour(s)</strong></p>
        </div>
        <p style="color:#374151;">
          Merci de retourner ce livre dès que possible pour éviter une augmentation de l'amende.
        </p>
        """
    );
  }

  private String buildEmailLivreDisponible(Utilisateur u, String titreLivre) {
    return baseTemplate(
        "Votre réservation est disponible",
        """
        <p style="color:#374151;font-size:16px;line-height:1.6;">
          Bonjour <strong>""" + u.getPrenom() + " " + u.getNom() + """
          </strong>,
        </p>
        <p style="color:#374151;">
          Bonne nouvelle ! Le livre que vous avez réservé est maintenant disponible.
        </p>
        <div style="background:#f0fdf4;border-left:4px solid #1B4332;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#374151;">Livre: <strong>""" + titreLivre + """
          </strong></p>
          <p style="margin:8px 0 0;color:#374151;">Vous avez <strong>3 jours</strong> pour venir le récupérer.</p>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="http://localhost:1420/reservations"
             style="background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;
                    text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Voir mes réservations
          </a>
        </div>
        """
    );
  }

  private String buildEmailAmende(Utilisateur u, String titreLivre, double montant) {
    return baseTemplate(
        "Amende générée",
        """
        <p style="color:#374151;font-size:16px;line-height:1.6;">
          Bonjour <strong>""" + u.getPrenom() + " " + u.getNom() + """
          </strong>,
        </p>
        <p style="color:#374151;">
          Une amende a été générée suite au retard de retour du livre suivant.
        </p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#374151;">Livre : <strong>""" + titreLivre + """
          </strong></p>
          <p style="margin:8px 0 0;color:#dc2626;">Montant : <strong>""" + String.format("%.0f", montant) + """
           FCFA</strong></p>
        </div>
        <p style="color:#374151;">
          Veuillez vous présenter à la bibliothèque pour régulariser votre situation.
        </p>
        """
    );
  }

  private String buildEmailEmpruntProlonge(Utilisateur u, String titreLivre, String nouvelleDateRetour) {
    return baseTemplate(
        "Emprunt prolongé",
        """
        <p style="color:#374151;font-size:16px;line-height:1.6;">
          Bonjour <strong>""" + u.getPrenom() + " " + u.getNom() + """
          </strong>,
        </p>
        <p style="color:#374151;">
          Votre emprunt a été prolongé avec succès.
        </p>
        <div style="background:#f0fdf4;border-left:4px solid #1B4332;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#374151;">Livre : <strong>""" + titreLivre + """
          </strong></p>
          <p style="margin:8px 0 0;color:#374151;">Nouvelle date de retour : <strong>""" + nouvelleDateRetour + """
          </strong></p>
          <p style="margin:8px 0 0;color:#16a34a;">Prolongation confirmée</p>
        </div>
        <p style="color:#374151;">
          Merci de retourner ce document avant la nouvelle date prévue pour éviter toute amende.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="http://localhost:1420/emprunts"
             style="background:#1B4332;color:#fff;padding:12px 28px;border-radius:8px;
                    text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Voir mes emprunts
          </a>
        </div>
        """
    );
  }

  private String baseTemplate(String titre, String contenu) {
    return """
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:12px;overflow:hidden;
                            box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                      Bibliothèque ESTA
                    </h1>
                    <p style="margin:8px 0 0;color:#95D5B2;font-size:13px;">Système de gestion de bibliothèque</p>
                  </td>
                </tr>
                <!-- Titre section -->
                <tr>
                  <td style="padding:32px 40px 0;">
                    <h2 style="margin:0;color:#1B4332;font-size:20px;font-weight:700;">""" + titre + """
                    </h2>
                    <hr style="border:none;border-top:2px solid #e9c46a;margin:12px 0 20px;width:60px;text-align:left;margin-left:0;">
                  </td>
                </tr>
                <!-- Contenu -->
                <tr>
                  <td style="padding:0 40px 32px;">""" + contenu + """
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      Cet email a été envoyé automatiquement par le système de la Bibliothèque ESTA.<br>
                      © 2026 Bibliothèque ESTA.Tous droits réservés
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
  }
}
