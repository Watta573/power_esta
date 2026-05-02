package com.biblioteca.service;

import com.biblioteca.entity.Cotisation;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.repository.CotisationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AbonnementRelanceService {

    private final CotisationRepository cotisationRepo;
    private final EmailService emailService;

    // ─── Relances expiration (tous les jours à 9h) ────────────────────────────

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void relancerExpirations() {
        LocalDate today = LocalDate.now();

        // J-7, J-4, J-2 : abonnements actifs qui expirent bientôt
        for (int joursAvant : new int[]{7, 4, 2}) {
            LocalDate dateCible = today.plusDays(joursAvant);
            List<Cotisation> cotisations = cotisationRepo
                .findByStatutAndDateFin("ACTIVE", dateCible);
            for (Cotisation c : cotisations) {
                envoyerRelanceExpiration(c.getUtilisateur(), c, joursAvant);
                log.info("[RELANCE] Expiration dans {}j — user={}", joursAvant, c.getUtilisateur().getEmail());
            }
        }

        // J-0 : abonnements expirés aujourd'hui
        List<Cotisation> expires = cotisationRepo.findByStatutAndDateFin("ACTIVE", today.minusDays(1));
        for (Cotisation c : expires) {
            // Passer en EXPIREE
            c.setStatut("EXPIREE");
            cotisationRepo.save(c);
            envoyerRelanceExpire(c.getUtilisateur(), c);
            log.info("[RELANCE] Abonnement expiré — user={}", c.getUtilisateur().getEmail());
        }
    }

    // ─── Relance demandes EN_ATTENTE oubliées (tous les jours à 10h) ─────────

    @Scheduled(cron = "0 0 10 * * *")
    @Transactional(readOnly = true)
    public void relancerDemandesOubliees() {
        LocalDate il3Jours = LocalDate.now().minusDays(3);
        // Demandes soumises il y a 3 jours et toujours EN_ATTENTE
        List<Cotisation> enAttente = cotisationRepo
            .findByStatutAndDateDebutBefore("EN_ATTENTE", il3Jours);
        for (Cotisation c : enAttente) {
            envoyerRelanceDemandeOubliee(c.getUtilisateur(), c);
            log.info("[RELANCE] Demande oubliée — user={}", c.getUtilisateur().getEmail());
        }
    }

    // ─── Emails ───────────────────────────────────────────────────────────────

    private void envoyerRelanceExpiration(Utilisateur u, Cotisation c, int joursRestants) {
        try {
            String sujet = joursRestants <= 2
                ? "Urgent - Votre abonnement expire dans " + joursRestants + " jour(s) - Bibliotheque ESTA"
                : "Rappel - Votre abonnement expire dans " + joursRestants + " jours - Bibliotheque ESTA";
            String html = emailService.buildEmailRelanceExpiration(
                u.getPrenom(), c.getNotes(), c.getDateFin().toString(), joursRestants);
            emailService.sendSimpleEmail(u.getEmail(), sujet, html);
        } catch (Exception e) {
            log.error("Erreur envoi relance expiration: {}", e.getMessage());
        }
    }

    private void envoyerRelanceExpire(Utilisateur u, Cotisation c) {
        try {
            String html = emailService.buildEmailAbonnementExpire(
                u.getPrenom(), c.getNotes(), c.getDateFin().toString());
            emailService.sendSimpleEmail(u.getEmail(),
                "Votre abonnement a expire - Bibliotheque ESTA", html);
        } catch (Exception e) {
            log.error("Erreur envoi relance expire: {}", e.getMessage());
        }
    }

    private void envoyerRelanceDemandeOubliee(Utilisateur u, Cotisation c) {
        try {
            String html = emailService.buildEmailDemandeOubliee(
                u.getPrenom(), c.getNotes(), c.getMontant().doubleValue(),
                c.getCodeReservation(), c.getDateDebut().toString());
            emailService.sendSimpleEmail(u.getEmail(),
                "Rappel - Votre demande d'abonnement est en attente - Bibliotheque ESTA", html);
        } catch (Exception e) {
            log.error("Erreur envoi relance demande oubliee: {}", e.getMessage());
        }
    }
}
