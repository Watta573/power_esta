package com.biblioteca.controller.api;

import com.biblioteca.entity.Cotisation;
import com.biblioteca.entity.FormulaAbonnement;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CotisationRepository;
import com.biblioteca.repository.FormulaAbonnementRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.AuditService;
import com.biblioteca.service.CinetPayService;
import com.biblioteca.service.EmailService;
import com.biblioteca.service.ReceiptPdfService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/cinetpay")
@RequiredArgsConstructor
@Slf4j
public class CinetPayController {

    private final CinetPayService cinetPayService;
    private final CotisationRepository cotisationRepo;
    private final FormulaAbonnementRepository formulaRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final EmailService emailService;
    private final ReceiptPdfService receiptPdfService;
    private final AuditService auditService;

    // Statuts terminaux — on ne retraite pas une cotisation dans ces états
    private static final Set<String> STATUTS_TERMINAUX = Set.of("ACTIVE", "ANNULEE", "REJETEE");

    public record InitierRequest(
        @NotNull @Positive Long formulaId,
        boolean renouveler
    ) {}

    // ─── 1. Initier un paiement Mobile Money ─────────────────────────────────

    @PostMapping("/initier")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, String>> initier(
            @Valid @RequestBody InitierRequest req,
            @AuthenticationPrincipal String email,
            HttpServletRequest httpRequest) {

        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        // Vérifier que le compte est actif
        if (!Boolean.TRUE.equals(u.getActif())) {
            throw new BusinessException("Compte inactif — contactez la bibliothèque");
        }

        FormulaAbonnement formula = formulaRepo.findById(req.formulaId())
                .orElseThrow(() -> new BusinessException("Formule introuvable"));

        if (!Boolean.TRUE.equals(formula.getActif())) {
            throw new BusinessException("Cette formule n'est plus disponible");
        }

        // Idempotence : vérifier si un paiement en cours existe déjà pour cette formule
        var enCours = cotisationRepo
                .findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "PAIEMENT_EN_COURS");
        if (enCours.isPresent()) {
            // Retourner le paiement existant plutôt que d'en créer un nouveau
            log.info("[CinetPay] Paiement déjà en cours — user={} code={}",
                email, enCours.get().getCodeReservation());
            throw new BusinessException("Un paiement est déjà en cours. Finalisez-le ou attendez son expiration.");
        }

        var enAttente = cotisationRepo
                .findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "EN_ATTENTE");
        if (enAttente.isPresent()) {
            throw new BusinessException("Vous avez déjà une demande en attente de validation");
        }

        // Calculer les dates
        LocalDate debut;
        if (req.renouveler()) {
            var actif = cotisationRepo
                    .findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "ACTIVE");
            debut = actif.isPresent() && !actif.get().getDateFin().isBefore(LocalDate.now())
                    ? actif.get().getDateFin().plusDays(1) : LocalDate.now();
        } else {
            var existing = cotisationRepo
                    .findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "ACTIVE");
            if (existing.isPresent() && !existing.get().getDateFin().isBefore(LocalDate.now())) {
                throw new BusinessException("Vous avez déjà un abonnement actif jusqu'au "
                        + existing.get().getDateFin());
            }
            debut = LocalDate.now();
        }
        LocalDate fin = debut.plusMonths(formula.getDureeMois());

        // Créer la cotisation
        Cotisation c = Cotisation.builder()
                .utilisateur(u)
                .montant(formula.getPrix())
                .dateDebut(debut)
                .dateFin(fin)
                .statut("PAIEMENT_EN_COURS")
                .notes(formula.getNom())
                .build();
        cotisationRepo.save(c);

        // Initier CinetPay
        String description = "Abonnement " + formula.getNom() + " - Bibliotheque ESTA";
        CinetPayService.PaiementInitie result = cinetPayService.initierPaiement(
                c.getCodeReservation(), formula.getPrix().doubleValue(),
                description, u.getPrenom() + " " + u.getNom(),
                u.getEmail(), u.getTelephone());

        if (result.paymentUrl() == null) {
            c.setStatut("ANNULEE");
            cotisationRepo.save(c);
            auditService.log(u.getId(), u.getEmail(), u.getRole().name(),
                "CINETPAY_INIT_FAILED",
                "Échec initiation — code=" + result.code() + " msg=" + result.message(),
                httpRequest.getRemoteAddr(), "ECHEC");
            throw new BusinessException("Erreur de paiement : " + result.message());
        }

        auditService.log(u.getId(), u.getEmail(), u.getRole().name(),
            "CINETPAY_INIT_OK",
            "Paiement initié — code=" + c.getCodeReservation() + " formule=" + formula.getNom(),
            httpRequest.getRemoteAddr(), "SUCCES");

        return ResponseEntity.ok(Map.of(
                "paymentUrl",    result.paymentUrl(),
                "transactionId", c.getCodeReservation(),
                "formule",       formula.getNom(),
                "montant",       formula.getPrix().toString(),
                "dateDebut",     debut.toString(),
                "dateFin",       fin.toString()
        ));
    }

    // ─── 2. Webhook CinetPay ──────────────────────────────────────────────────
    // Sécurisé par CinetPayWebhookFilter (IP whitelist + rate limit + validation)

    @PostMapping("/notify")
    @Transactional
    public ResponseEntity<String> notify(HttpServletRequest request) {
        String transactionId = request.getParameter("cpm_trans_id");
        String result        = request.getParameter("cpm_result");

        log.info("[CinetPay-Webhook] Notification reçue — transactionId={} result={}",
            transactionId, result);

        // Double vérification auprès de CinetPay (ne jamais faire confiance au webhook seul)
        CinetPayService.StatutPaiement statut = cinetPayService.verifierPaiement(transactionId);

        Cotisation c = cotisationRepo.findByCodeReservation(transactionId.toUpperCase()).orElse(null);
        if (c == null) {
            log.warn("[CinetPay-Webhook] Cotisation introuvable — transactionId={}", transactionId);
            return ResponseEntity.ok("NOT_FOUND");
        }

        // Idempotence : ne pas retraiter un statut terminal
        if (STATUTS_TERMINAUX.contains(c.getStatut())) {
            log.info("[CinetPay-Webhook] Cotisation déjà en statut terminal={} — ignoré", c.getStatut());
            return ResponseEntity.ok("ALREADY_PROCESSED");
        }

        if (statut.success()) {
            activerAbonnement(c, "WEBHOOK");
        } else {
            log.warn("[CinetPay-Webhook] Paiement refusé — status={} msg={}", statut.status(), statut.message());
            c.setStatut("ANNULEE");
            cotisationRepo.save(c);
            auditService.log(c.getUtilisateur().getId(), c.getUtilisateur().getEmail(),
                c.getUtilisateur().getRole().name(), "CINETPAY_PAYMENT_REFUSED",
                "Paiement refusé — code=" + transactionId + " status=" + statut.status(),
                "cinetpay-webhook", "ECHEC");
        }

        return ResponseEntity.ok("OK");
    }

    // ─── 3. Vérification manuelle (polling frontend) ──────────────────────────

    @GetMapping("/verifier/{transactionId}")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifier(
            @PathVariable String transactionId,
            @AuthenticationPrincipal String email) {

        // Validation format
        if (!transactionId.matches("^[A-Z0-9]{6,20}$")) {
            throw new BusinessException("Format de transaction invalide");
        }

        Cotisation c = cotisationRepo.findByCodeReservation(transactionId.toUpperCase())
                .orElseThrow(() -> new BusinessException("Transaction introuvable"));

        // Seul le propriétaire peut vérifier
        if (!c.getUtilisateur().getEmail().equals(email)) {
            log.warn("[CinetPay] Tentative d'accès non autorisé — user={} transactionId={}", email, transactionId);
            throw new BusinessException("Accès refusé");
        }

        // Déjà activé
        if ("ACTIVE".equals(c.getStatut())) {
            return ResponseEntity.ok(Map.of("statut", "ACTIVE", "message", "Abonnement actif"));
        }

        // Statut terminal autre qu'ACTIVE
        if (STATUTS_TERMINAUX.contains(c.getStatut())) {
            return ResponseEntity.ok(Map.of("statut", c.getStatut(), "message", "Transaction terminée"));
        }

        // Vérifier auprès de CinetPay
        CinetPayService.StatutPaiement statut = cinetPayService.verifierPaiement(transactionId);
        if (statut.success()) {
            activerAbonnement(c, "POLLING");
            return ResponseEntity.ok(Map.of("statut", "ACTIVE", "message", "Paiement confirmé, abonnement activé"));
        }

        return ResponseEntity.ok(Map.of(
                "statut",         c.getStatut(),
                "cinetpayStatus", statut.status(),
                "message",        statut.message()
        ));
    }

    // ─── Activation commune (idempotente) ─────────────────────────────────────

    private void activerAbonnement(Cotisation c, String source) {
        if ("ACTIVE".equals(c.getStatut())) return;

        c.setStatut("ACTIVE");
        c.setDatePaiement(LocalDate.now());
        cotisationRepo.save(c);

        log.info("[CinetPay] Abonnement activé via {} — code={} user={}",
            source, c.getCodeReservation(), c.getUtilisateur().getEmail());

        auditService.log(c.getUtilisateur().getId(), c.getUtilisateur().getEmail(),
            c.getUtilisateur().getRole().name(), "CINETPAY_PAYMENT_OK",
            "Abonnement activé via " + source + " — code=" + c.getCodeReservation()
            + " formule=" + c.getNotes() + " montant=" + c.getMontant(),
            "cinetpay", "SUCCES");

        // Reçu PDF
        try {
            byte[] pdf = receiptPdfService.generateCotisationReceipt(c, null);
            emailService.sendCotisationReceipt(
                    c.getUtilisateur().getEmail(),
                    c.getUtilisateur().getPrenom() + " " + c.getUtilisateur().getNom(),
                    pdf, c.getMontant().doubleValue(),
                    c.getDateDebut().toString(), c.getDateFin().toString());
        } catch (Exception e) {
            log.error("[CinetPay] Erreur envoi reçu — code={} error={}", c.getCodeReservation(), e.getMessage());
        }

        // Email confirmation
        try {
            Utilisateur u = c.getUtilisateur();
            String dateHeure = java.time.LocalDateTime.now().format(
                java.time.format.DateTimeFormatter.ofPattern(
                    "EEEE dd MMMM yyyy 'à' HH:mm", java.util.Locale.FRENCH));
            String html = emailService.buildEmailConfirmationAbonnement(
                    u.getPrenom(), c.getNotes(), c.getMontant().doubleValue(),
                    c.getDateDebut().toString(), c.getDateFin().toString(),
                    c.getCodeReservation(), dateHeure, 3);
            emailService.sendSimpleEmail(u.getEmail(), "Abonnement confirme - Bibliotheque ESTA", html);
        } catch (Exception e) {
            log.error("[CinetPay] Erreur envoi confirmation — code={} error={}", c.getCodeReservation(), e.getMessage());
        }
    }
}
