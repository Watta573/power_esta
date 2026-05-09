package com.biblioteca.controller.api;

import com.biblioteca.entity.Cotisation;
import com.biblioteca.entity.FormulaAbonnement;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CotisationRepository;
import com.biblioteca.repository.FormulaAbonnementRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.security.JwtService;
import com.biblioteca.service.EmailService;
import com.biblioteca.service.ReceiptPdfService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/abonnements")
@RequiredArgsConstructor
public class AbonnementApiController {

    private final FormulaAbonnementRepository formulaRepo;
    private final CotisationRepository cotisationRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ReceiptPdfService receiptPdfService;

    // ─── DTOs ────────────────────────────────────────────────────────────────

    public record FormulaDto(Long id, String nom, String description, double prix,
                              int dureeMois, int maxEmpruntsSimultanes, String couleur, int ordre) {}

    public record SouscrireRequest(Long formulaId) {}

    public record AbonnementActifDto(boolean actif, String formule, String dateDebut,
                                      String dateFin, double montant, String statut,
                                      int maxEmprunts, int joursRestants) {}

    public record CotisationInfoDto(Long id, String codeReservation, String utilisateur,
                                     String email, String identifiant, String formule,
                                     double montant, String dateDebut, String dateFin, String statut) {}

    // ─── Init formules par défaut ─────────────────────────────────────────────

    @PostConstruct
    @Transactional
    public void initFormules() {
        if (formulaRepo.count() > 0) return;
        formulaRepo.saveAll(List.of(
            FormulaAbonnement.builder()
                .nom("Mensuel").description("Accès complet pendant 1 mois")
                .prix(BigDecimal.valueOf(2000)).dureeMois(1)
                .maxEmpruntsSimultanes(2).couleur("blue").ordre(1).actif(true).build(),
            FormulaAbonnement.builder()
                .nom("Trimestriel").description("Accès complet pendant 3 mois")
                .prix(BigDecimal.valueOf(5000)).dureeMois(3)
                .maxEmpruntsSimultanes(3).couleur("green").ordre(2).actif(true).build(),
            FormulaAbonnement.builder()
                .nom("Semestriel").description("Accès complet pendant 6 mois")
                .prix(BigDecimal.valueOf(8000)).dureeMois(6)
                .maxEmpruntsSimultanes(5).couleur("purple").ordre(3).actif(true).build(),
            FormulaAbonnement.builder()
                .nom("Annuel").description("Accès complet pendant 12 mois — Meilleure valeur")
                .prix(BigDecimal.valueOf(12000)).dureeMois(12)
                .maxEmpruntsSimultanes(10).couleur("gold").ordre(4).actif(true).build()
        ));
    }

    // ─── Endpoints publics (authentifiés) ────────────────────────────────────

    @GetMapping("/formules")
    public List<FormulaDto> getFormules() {
        return formulaRepo.findByActifTrueOrderByOrdreAsc().stream().map(this::toFormulaDto).toList();
    }

    @GetMapping("/mon-abonnement")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public AbonnementActifDto getMonAbonnement(@AuthenticationPrincipal String email) {
        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        // 1. Chercher un abonnement ACTIVE
        var optActive = cotisationRepo.findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "ACTIVE");
        if (optActive.isPresent()) {
            Cotisation c = optActive.get();
            boolean valide = !c.getDateFin().isBefore(LocalDate.now());
            if (valide) {
                int joursRestants = (int) (c.getDateFin().toEpochDay() - LocalDate.now().toEpochDay());
                return new AbonnementActifDto(true, c.getNotes(), c.getDateDebut().toString(),
                        c.getDateFin().toString(), c.getMontant().doubleValue(), "ACTIVE", 0, joursRestants);
            }
        }

        // 2. Chercher une demande EN_ATTENTE
        var optAttente = cotisationRepo.findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "EN_ATTENTE");
        if (optAttente.isPresent()) {
            Cotisation c = optAttente.get();
            return new AbonnementActifDto(false, c.getNotes(), c.getDateDebut().toString(),
                    c.getDateFin().toString(), c.getMontant().doubleValue(), "EN_ATTENTE", 0, 0);
        }

        return new AbonnementActifDto(false, null, null, null, 0, "AUCUN", 0, 0);
    }

    @PostMapping("/souscrire")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, String>> souscrire(
            @RequestBody SouscrireRequest req,
            @AuthenticationPrincipal String email) {
        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        FormulaAbonnement formula = formulaRepo.findById(req.formulaId())
                .orElseThrow(() -> new BusinessException("Formule introuvable"));

        // Vérifier si abonnement actif existant
        var existing = cotisationRepo.findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "ACTIVE");
        if (existing.isPresent() && !existing.get().getDateFin().isBefore(LocalDate.now())) {
            throw new BusinessException("Vous avez déjà un abonnement actif jusqu'au " + existing.get().getDateFin());
        }

        // Créer la cotisation en attente de validation
        LocalDate debut = LocalDate.now();
        LocalDate fin = debut.plusMonths(formula.getDureeMois());
        Cotisation c = Cotisation.builder()
                .utilisateur(u)
                .montant(formula.getPrix())
                .dateDebut(debut)
                .dateFin(fin)
                .statut("EN_ATTENTE")
                .notes(formula.getNom())
                .build();
        cotisationRepo.save(c);

        // Email de confirmation de soumission HTML
        try {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String dateHeure = now.format(java.time.format.DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy 'à' HH:mm", java.util.Locale.FRENCH));
            String html = emailService.buildEmailSouscription(
                u.getPrenom(), formula.getNom(), formula.getPrix().doubleValue(),
                debut.toString(), fin.toString(), c.getCodeReservation(), dateHeure);
            emailService.sendSimpleEmail(u.getEmail(), "Demande d'abonnement enregistree - Bibliotheque ESTA", html);
        } catch (Exception e) {
            System.err.println("Erreur envoi email souscription: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Demande d'abonnement soumise. Rendez-vous à la bibliothèque pour le paiement.",
                "formule", formula.getNom(),
                "montant", formula.getPrix().toString(),
                "dateDebut", debut.toString(),
                "dateFin", fin.toString()
        ));
    }

    // ─── Endpoints staff ──────────────────────────────────────────────────────

    /**
     * Étape 1 : Notifier l'utilisateur de venir payer
     */
    @PostMapping("/notifier/{cotisationId}")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional
    public ResponseEntity<Map<String, String>> notifier(@PathVariable Long cotisationId) {
        Cotisation c = cotisationRepo.findById(cotisationId)
                .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
        if (!"EN_ATTENTE".equals(c.getStatut())) {
            throw new BusinessException("Cette demande n'est pas en attente");
        }
        Utilisateur u = c.getUtilisateur();
        // Email notifier payer HTML
        try {
            String html = emailService.buildEmailNotifierPayer(
                u.getPrenom(), c.getNotes(), c.getMontant().doubleValue(), c.getCodeReservation());
            emailService.sendSimpleEmail(u.getEmail(), "Venez finaliser votre abonnement - Bibliotheque ESTA", html);
        } catch (Exception e) {
            System.err.println("Erreur envoi notification: " + e.getMessage());
        }
        return ResponseEntity.ok(Map.of(
            "message", "Notification envoyée",
            "code", c.getCodeReservation()
        ));
    }

    /**
     * Étape 2 : Rechercher une cotisation par son code barre
     */
    @GetMapping("/rechercher/{code}")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional(readOnly = true)
    public CotisationInfoDto rechercherParCode(@PathVariable String code) {
        Cotisation c = cotisationRepo.findByCodeReservation(code.toUpperCase())
                .orElseThrow(() -> new BusinessException("Code introuvable : " + code));
        return toCotisationInfoDto(c);
    }

    /**
     * Étape 3 : Valider, imprimer le reçu et notifier l'utilisateur
     */
    @PostMapping("/valider/{cotisationId}")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional
    public ResponseEntity<Map<String, String>> valider(
            @PathVariable Long cotisationId,
            HttpServletRequest request) {
        Cotisation c = cotisationRepo.findById(cotisationId)
                .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
        c.setStatut("ACTIVE");
        c.setDatePaiement(LocalDate.now());
        cotisationRepo.save(c);

        Utilisateur exporteur = null;
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            exporteur = utilisateurRepo.findByEmail(jwtService.extractUsername(token.substring(7))).orElse(null);
        }

        // Envoyer reçu PDF
        try {
            byte[] pdf = receiptPdfService.generateCotisationReceipt(c, exporteur);
            emailService.sendCotisationReceipt(
                    c.getUtilisateur().getEmail(),
                    c.getUtilisateur().getPrenom() + " " + c.getUtilisateur().getNom(),
                    pdf, c.getMontant().doubleValue(),
                    c.getDateDebut().toString(), c.getDateFin().toString());
        } catch (Exception e) {
            System.err.println("Erreur envoi reçu: " + e.getMessage());
        }

        // Email confirmation finale HTML
        try {
            Utilisateur u = c.getUtilisateur();
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String dateHeure = now.format(java.time.format.DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy 'à' HH:mm", java.util.Locale.FRENCH));
            String html = emailService.buildEmailConfirmationAbonnement(
                u.getPrenom(), c.getNotes(), c.getMontant().doubleValue(),
                c.getDateDebut().toString(), c.getDateFin().toString(),
                c.getCodeReservation(), dateHeure, 3);
            emailService.sendSimpleEmail(u.getEmail(), "Abonnement confirme - Bibliotheque ESTA", html);
        } catch (Exception e) {
            System.err.println("Erreur envoi confirmation: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Abonnement validé, reçu et confirmation envoyés"));
    }

    @PostMapping("/rejeter/{cotisationId}")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional
    public ResponseEntity<Map<String, String>> rejeter(@PathVariable Long cotisationId) {
        Cotisation c = cotisationRepo.findById(cotisationId)
                .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
        c.setStatut("ANNULEE");
        cotisationRepo.save(c);
        return ResponseEntity.ok(Map.of("message", "Demande rejetée"));
    }

    @PostMapping("/annuler-demande")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, String>> annulerDemande(@AuthenticationPrincipal String email) {
        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        Cotisation c = cotisationRepo
                .findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "EN_ATTENTE")
                .orElseThrow(() -> new BusinessException("Aucune demande en attente"));
        c.setStatut("ANNULEE");
        cotisationRepo.save(c);
        return ResponseEntity.ok(Map.of("message", "Demande annulée"));
    }

    @GetMapping("/en-attente")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEnAttente() {
        return cotisationRepo.findByStatutOrderByDatePaiementDesc("EN_ATTENTE",
                org.springframework.data.domain.PageRequest.of(0, 100))
                .getContent().stream().map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "utilisateur", c.getUtilisateur().getPrenom() + " " + c.getUtilisateur().getNom(),
                        "email", c.getUtilisateur().getEmail(),
                        "formule", c.getNotes() != null ? c.getNotes() : "—",
                        "montant", c.getMontant().doubleValue(),
                        "dateDebut", c.getDateDebut().toString(),
                        "dateFin", c.getDateFin().toString(),
                        "codeReservation", c.getCodeReservation() != null ? c.getCodeReservation() : "—"
                )).toList();
    }

    // ─── Vue tous les abonnements (admin/biblio) ──────────────────────────────

    public record CotisationListDto(
        Long id, String codeReservation, String utilisateur, String email,
        String identifiant, String formule, double montant,
        String dateDebut, String dateFin, String datePaiement, String statut
    ) {}

    @GetMapping("/tous")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<CotisationListDto> getTous(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String formule,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size,
            org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        var all = cotisationRepo.findAllByOrderByDatePaiementDesc(
            org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        var filtered = all.stream().filter(c -> {
            if (statut != null && !statut.isBlank() && !statut.equals(c.getStatut())) return false;
            if (formule != null && !formule.isBlank() && !formule.equals(c.getNotes())) return false;
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                Utilisateur u = c.getUtilisateur();
                return u.getNom().toLowerCase().contains(q)
                    || u.getPrenom().toLowerCase().contains(q)
                    || u.getEmail().toLowerCase().contains(q)
                    || u.getIdentifiant().toLowerCase().contains(q)
                    || (c.getCodeReservation() != null && c.getCodeReservation().toLowerCase().contains(q));
            }
            return true;
        }).map(this::toCotisationListDto).toList();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        var pageContent = start >= filtered.size() ? List.<CotisationListDto>of() : filtered.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, filtered.size());
    }

    // ─── Mes abonnements (membre) ─────────────────────────────────────────────

    @GetMapping("/mes-abonnements")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<CotisationListDto> getMesAbonnements(
            @AuthenticationPrincipal String email,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String formule,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var all = cotisationRepo.findByUtilisateurIdOrderByDatePaiementDesc(u.getId(),
            org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        var filtered = all.stream().filter(c -> {
            if (statut != null && !statut.isBlank() && !statut.equals(c.getStatut())) return false;
            if (formule != null && !formule.isBlank() && !formule.equals(c.getNotes())) return false;
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                return c.getNotes() != null && c.getNotes().toLowerCase().contains(q)
                    || (c.getCodeReservation() != null && c.getCodeReservation().toLowerCase().contains(q));
            }
            return true;
        }).map(this::toCotisationListDto).toList();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        var pageContent = start >= filtered.size() ? List.<CotisationListDto>of() : filtered.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, filtered.size());
    }

    // ─── Renouvellement (membre) ──────────────────────────────────────────────

    @PostMapping("/renouveler")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, String>> renouveler(
            @RequestBody SouscrireRequest req,
            @AuthenticationPrincipal String email) {
        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
        // Vérifier pas de demande EN_ATTENTE existante
        var enAttente = cotisationRepo.findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "EN_ATTENTE");
        if (enAttente.isPresent()) {
            throw new BusinessException("Vous avez déjà une demande en attente de validation");
        }
        FormulaAbonnement formula = formulaRepo.findById(req.formulaId())
                .orElseThrow(() -> new BusinessException("Formule introuvable"));
        // Partir de la date de fin de l'abonnement actif si encore valide, sinon aujourd'hui
        var actif = cotisationRepo.findTopByUtilisateurIdAndStatutOrderByDateFinDesc(u.getId(), "ACTIVE");
        LocalDate debut = actif.isPresent() && !actif.get().getDateFin().isBefore(LocalDate.now())
            ? actif.get().getDateFin().plusDays(1) : LocalDate.now();
        LocalDate fin = debut.plusMonths(formula.getDureeMois());
        Cotisation c = Cotisation.builder()
                .utilisateur(u).montant(formula.getPrix())
                .dateDebut(debut).dateFin(fin)
                .statut("EN_ATTENTE").notes(formula.getNom())
                .build();
        cotisationRepo.save(c);
        try {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String dateHeure = now.format(java.time.format.DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy 'à' HH:mm", java.util.Locale.FRENCH));
            String html = emailService.buildEmailSouscription(
                u.getPrenom(), formula.getNom(), formula.getPrix().doubleValue(),
                debut.toString(), fin.toString(), c.getCodeReservation(), dateHeure);
            emailService.sendSimpleEmail(u.getEmail(), "Renouvellement d'abonnement - Bibliotheque ESTA", html);
        } catch (Exception e) {
            System.err.println("Erreur envoi email renouvellement: " + e.getMessage());
        }
        return ResponseEntity.ok(Map.of(
            "message", "Demande de renouvellement soumise.",
            "formule", formula.getNom(),
            "dateDebut", debut.toString(),
            "dateFin", fin.toString()
        ));
    }

    // ─── Export Excel ─────────────────────────────────────────────────────────

    @GetMapping("/export/excel")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String formule,
            @RequestParam(required = false) String search) throws Exception {
        var items = getTous(statut, formule, search, 0, Integer.MAX_VALUE).getContent();
        byte[] bytes = buildExcel(items);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=abonnements.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(bytes);
    }

    @GetMapping("/mes-abonnements/export/excel")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportMesExcel(
            @AuthenticationPrincipal String email,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String formule,
            @RequestParam(required = false) String search) throws Exception {
        var items = getMesAbonnements(email, statut, formule, search, 0, Integer.MAX_VALUE).getContent();
        byte[] bytes = buildExcel(items);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mes-abonnements.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(bytes);
    }

    private byte[] buildExcel(List<CotisationListDto> items) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Abonnements");
            String[] headers = {"Code", "Adhérent", "Email", "Identifiant", "Formule", "Montant (FCFA)", "Début", "Fin", "Paiement", "Statut"};
            Row headerRow = sheet.createRow(0);
            CellStyle style = wb.createCellStyle();
            Font font = wb.createFont(); font.setBold(true); style.setFont(font);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]); cell.setCellStyle(style);
            }
            int rowNum = 1;
            for (CotisationListDto c : items) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(c.codeReservation());
                row.createCell(1).setCellValue(c.utilisateur());
                row.createCell(2).setCellValue(c.email());
                row.createCell(3).setCellValue(c.identifiant());
                row.createCell(4).setCellValue(c.formule());
                row.createCell(5).setCellValue(c.montant());
                row.createCell(6).setCellValue(c.dateDebut());
                row.createCell(7).setCellValue(c.dateFin());
                row.createCell(8).setCellValue(c.datePaiement());
                row.createCell(9).setCellValue(c.statut());
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }

    // ─── Export PDF ───────────────────────────────────────────────────────────

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String formule,
            @RequestParam(required = false) String search) throws Exception {
        var items = getTous(statut, formule, search, 0, Integer.MAX_VALUE).getContent();
        byte[] bytes = buildPdf(items, "Tous les abonnements");
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=abonnements.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(bytes);
    }

    @GetMapping("/mes-abonnements/export/pdf")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportMesPdf(
            @AuthenticationPrincipal String email,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String formule,
            @RequestParam(required = false) String search) throws Exception {
        var items = getMesAbonnements(email, statut, formule, search, 0, Integer.MAX_VALUE).getContent();
        byte[] bytes = buildPdf(items, "Mes abonnements");
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mes-abonnements.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(bytes);
    }

    private byte[] buildPdf(List<CotisationListDto> items, String titre) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            com.itextpdf.text.Document doc = new com.itextpdf.text.Document(
                com.itextpdf.text.PageSize.A4.rotate(), 20, 20, 30, 20);
            com.itextpdf.text.pdf.PdfWriter.getInstance(doc, out);
            doc.open();
            com.itextpdf.text.Font titleFont = com.itextpdf.text.FontFactory.getFont(
                com.itextpdf.text.FontFactory.HELVETICA_BOLD, 14);
            com.itextpdf.text.Font smallFont = com.itextpdf.text.FontFactory.getFont(
                com.itextpdf.text.FontFactory.HELVETICA, 8);
            com.itextpdf.text.Font boldSmall = com.itextpdf.text.FontFactory.getFont(
                com.itextpdf.text.FontFactory.HELVETICA_BOLD, 8);
            doc.add(new com.itextpdf.text.Paragraph(titre, titleFont));
            doc.add(new com.itextpdf.text.Paragraph("Généré le " + LocalDate.now(),
                com.itextpdf.text.FontFactory.getFont(com.itextpdf.text.FontFactory.HELVETICA, 9)));
            doc.add(com.itextpdf.text.Chunk.NEWLINE);
            com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(10);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{10, 13, 16, 10, 9, 9, 9, 9, 9, 8});
            String[] headers = {"Code", "Adhérent", "Email", "Identifiant", "Formule", "Montant", "Début", "Fin", "Paiement", "Statut"};
            for (String h : headers) {
                com.itextpdf.text.pdf.PdfPCell cell = new com.itextpdf.text.pdf.PdfPCell(
                    new com.itextpdf.text.Phrase(h, boldSmall));
                cell.setBackgroundColor(new com.itextpdf.text.BaseColor(220, 220, 220));
                cell.setPadding(4);
                table.addCell(cell);
            }
            for (CotisationListDto c : items) {
                for (String val : new String[]{
                    c.codeReservation(), c.utilisateur(), c.email(), c.identifiant(),
                    c.formule(), String.valueOf(c.montant()), c.dateDebut(), c.dateFin(),
                    c.datePaiement(), c.statut()}) {
                    com.itextpdf.text.pdf.PdfPCell cell = new com.itextpdf.text.pdf.PdfPCell(
                        new com.itextpdf.text.Phrase(val != null ? val : "—", smallFont));
                    cell.setPadding(3);
                    table.addCell(cell);
                }
            }
            doc.add(table);
            doc.close();
            return out.toByteArray();
        }
    }

    private CotisationListDto toCotisationListDto(Cotisation c) {
        Utilisateur u = c.getUtilisateur();
        return new CotisationListDto(
            c.getId(), c.getCodeReservation() != null ? c.getCodeReservation() : "—",
            u.getPrenom() + " " + u.getNom(), u.getEmail(), u.getIdentifiant(),
            c.getNotes() != null ? c.getNotes() : "—",
            c.getMontant().doubleValue(),
            c.getDateDebut() != null ? c.getDateDebut().toString() : "—",
            c.getDateFin() != null ? c.getDateFin().toString() : "—",
            c.getDatePaiement() != null ? c.getDatePaiement().toString() : "—",
            c.getStatut()
        );
    }

    // ─── Admin CRUD formules ──────────────────────────────────────────────────

    @PostMapping("/formules")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public FormulaDto creerFormule(@RequestBody FormulaAbonnement f) {
        return toFormulaDto(formulaRepo.save(f));
    }

    @PutMapping("/formules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public FormulaDto modifierFormule(@PathVariable Long id, @RequestBody FormulaAbonnement body) {
        FormulaAbonnement f = formulaRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Formule introuvable"));
        f.setNom(body.getNom()); f.setDescription(body.getDescription());
        f.setPrix(body.getPrix()); f.setDureeMois(body.getDureeMois());
        f.setMaxEmpruntsSimultanes(body.getMaxEmpruntsSimultanes());
        f.setCouleur(body.getCouleur()); f.setOrdre(body.getOrdre());
        return toFormulaDto(formulaRepo.save(f));
    }

    @DeleteMapping("/formules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> supprimerFormule(@PathVariable Long id) {
        FormulaAbonnement f = formulaRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Formule introuvable"));
        f.setActif(false);
        formulaRepo.save(f);
        return ResponseEntity.noContent().build();
    }

    private FormulaDto toFormulaDto(FormulaAbonnement f) {
        return new FormulaDto(f.getId(), f.getNom(), f.getDescription(),
                f.getPrix().doubleValue(), f.getDureeMois(),
                f.getMaxEmpruntsSimultanes(), f.getCouleur(),
                f.getOrdre() != null ? f.getOrdre() : 0);
    }

    private CotisationInfoDto toCotisationInfoDto(Cotisation c) {
        Utilisateur u = c.getUtilisateur();
        return new CotisationInfoDto(
            c.getId(), c.getCodeReservation(),
            u.getPrenom() + " " + u.getNom(),
            u.getEmail(), u.getIdentifiant(),
            c.getNotes() != null ? c.getNotes() : "—",
            c.getMontant().doubleValue(),
            c.getDateDebut().toString(), c.getDateFin().toString(),
            c.getStatut()
        );
    }
}
