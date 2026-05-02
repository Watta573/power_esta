package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.Cotisation;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CotisationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.EmailService;
import com.biblioteca.service.ReceiptPdfService;
import com.biblioteca.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping(value = "/api/cotisations", produces = MediaType.APPLICATION_JSON_VALUE)
public class CotisationApiController {

  private final CotisationRepository cotisationRepo;
  private final UtilisateurRepository utilisateurRepo;
  private final EmailService emailService;
  private final ReceiptPdfService receiptPdfService;
  private final JwtService jwtService;

  public CotisationApiController(CotisationRepository cotisationRepo,
                                  UtilisateurRepository utilisateurRepo,
                                  EmailService emailService,
                                  ReceiptPdfService receiptPdfService,
                                  JwtService jwtService) {
    this.cotisationRepo = cotisationRepo;
    this.utilisateurRepo = utilisateurRepo;
    this.emailService = emailService;
    this.receiptPdfService = receiptPdfService;
    this.jwtService = jwtService;
  }

  // ─── DTOs ────────────────────────────────────────────────────────────────

  public record CotisationDto(Long id, Long utilisateurId, String utilisateurNom,
                               String utilisateurEmail, double montant,
                               String dateDebut, String dateFin, String statut,
                               String notes, String datePaiement) {}

  public record CotisationRequest(
      @NotNull Long utilisateurId,
      @NotNull @Positive double montant,
      @NotNull String dateDebut,
      @NotNull String dateFin,
      String notes) {}

  public record StatsDto(long totalActives, long totalExpirees, double montantTotal) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────

  @GetMapping
  @Transactional(readOnly = true)
  public PageResponseDto<CotisationDto> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String statut,
      @RequestParam(required = false) Long utilisateurId) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "datePaiement"));
    var result = utilisateurId != null
        ? cotisationRepo.findByUtilisateurIdOrderByDatePaiementDesc(utilisateurId, pageable)
        : statut != null
            ? cotisationRepo.findByStatutOrderByDatePaiementDesc(statut, pageable)
            : cotisationRepo.findAllByOrderByDatePaiementDesc(pageable);
    return PageResponseDto.from(result.map(this::toDto));
  }

  @PostMapping
  @Transactional
  public ResponseEntity<CotisationDto> create(@Valid @RequestBody CotisationRequest req, HttpServletRequest request) {
    Utilisateur u = utilisateurRepo.findById(req.utilisateurId())
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    
    Cotisation c = Cotisation.builder()
        .utilisateur(u)
        .montant(BigDecimal.valueOf(req.montant()))
        .dateDebut(LocalDate.parse(req.dateDebut()))
        .dateFin(LocalDate.parse(req.dateFin()))
        .notes(req.notes())
        .statut("ACTIVE")
        .datePaiement(LocalDate.now())
        .build();
    
    Cotisation savedCotisation = cotisationRepo.save(c);
    
    // Récupérer l'utilisateur exporteur depuis le token JWT
    String token = request.getHeader("Authorization");
    Utilisateur exporteur = null;
    if (token != null && token.startsWith("Bearer ")) {
      String jwt = token.substring(7);
      String email = jwtService.extractUsername(jwt);
      exporteur = utilisateurRepo.findByEmail(email).orElse(null);
    }
    
    // Envoyer automatiquement le reçu par email
    try {
      byte[] pdfBytes = receiptPdfService.generateCotisationReceipt(savedCotisation, exporteur);
      String userName = u.getPrenom() + " " + u.getNom();
      emailService.sendCotisationReceipt(
          u.getEmail(),
          userName,
          pdfBytes,
          savedCotisation.getMontant().doubleValue(),
          savedCotisation.getDateDebut().toString(),
          savedCotisation.getDateFin().toString()
      );
    } catch (Exception e) {
      // Log l'erreur mais ne pas faire échouer la création de la cotisation
      System.err.println("Erreur lors de l'envoi automatique du reçu: " + e.getMessage());
    }
    
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(savedCotisation));
  }

  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  @Transactional(readOnly = true)
  public PageResponseDto<CotisationDto> getMyCotisations(
      HttpServletRequest request,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    // Récupérer l'utilisateur connecté
    String token = request.getHeader("Authorization");
    if (token == null || !token.startsWith("Bearer ")) {
      throw new BusinessException("Token manquant");
    }
    String jwt = token.substring(7);
    String email = jwtService.extractUsername(jwt);
    Utilisateur user = utilisateurRepo.findByEmail(email)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "datePaiement"));
    var result = cotisationRepo.findByUtilisateurIdOrderByDatePaiementDesc(user.getId(), pageable);
    return PageResponseDto.from(result.map(this::toDto));
  }

  @PostMapping("/me/{id}/send-receipt")
  @PreAuthorize("isAuthenticated()")
  @Transactional
  public ResponseEntity<Map<String, String>> sendMyReceipt(@PathVariable Long id, HttpServletRequest request) {
    // Récupérer l'utilisateur connecté
    String token = request.getHeader("Authorization");
    if (token == null || !token.startsWith("Bearer ")) {
      throw new BusinessException("Token manquant");
    }
    String jwt = token.substring(7);
    String email = jwtService.extractUsername(jwt);
    Utilisateur user = utilisateurRepo.findByEmail(email)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    
    Cotisation cotisation = cotisationRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
    
    // Vérifier que la cotisation appartient à l'utilisateur connecté
    if (!cotisation.getUtilisateur().getId().equals(user.getId())) {
      throw new BusinessException("Accès non autorisé");
    }
    
    try {
      // Générer le PDF
      byte[] pdfBytes = receiptPdfService.generateCotisationReceipt(cotisation, user);
      
      // Envoyer par email
      String userName = user.getPrenom() + " " + user.getNom();
      emailService.sendCotisationReceipt(
          user.getEmail(),
          userName,
          pdfBytes,
          cotisation.getMontant().doubleValue(),
          cotisation.getDateDebut().toString(),
          cotisation.getDateFin().toString()
      );
      
      return ResponseEntity.ok(Map.of("message", "Reçu envoyé par email avec succès"));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Erreur lors de l'envoi du reçu: " + e.getMessage()));
    }
  }

  @GetMapping("/{id}")
  @Transactional(readOnly = true)
  public CotisationDto getById(@PathVariable Long id) {
    Cotisation c = cotisationRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
    return toDto(c);
  }

  @PutMapping("/{id}/annuler")
  @Transactional
  public CotisationDto annuler(@PathVariable Long id) {
    Cotisation c = cotisationRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
    c.setStatut("ANNULEE");
    return toDto(cotisationRepo.save(c));
  }

  @PostMapping("/{id}/send-receipt")
  @Transactional
  public ResponseEntity<Map<String, String>> sendReceipt(@PathVariable Long id, HttpServletRequest request) {
    Cotisation cotisation = cotisationRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Cotisation introuvable"));
    
    // Récupérer l'utilisateur exporteur depuis le token JWT
    String token = request.getHeader("Authorization");
    Utilisateur exporteur = null;
    if (token != null && token.startsWith("Bearer ")) {
      String jwt = token.substring(7);
      String email = jwtService.extractUsername(jwt);
      exporteur = utilisateurRepo.findByEmail(email).orElse(null);
    }
    
    try {
      // Générer le PDF
      byte[] pdfBytes = receiptPdfService.generateCotisationReceipt(cotisation, exporteur);
      
      // Envoyer par email
      String userName = cotisation.getUtilisateur().getPrenom() + " " + cotisation.getUtilisateur().getNom();
      emailService.sendCotisationReceipt(
          cotisation.getUtilisateur().getEmail(),
          userName,
          pdfBytes,
          cotisation.getMontant().doubleValue(),
          cotisation.getDateDebut().toString(),
          cotisation.getDateFin().toString()
      );
      
      return ResponseEntity.ok(Map.of("message", "Reçu envoyé par email avec succès"));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Erreur lors de l'envoi du reçu: " + e.getMessage()));
    }
  }

  @GetMapping("/stats")
  public StatsDto stats() {
    long actives  = cotisationRepo.countActives(LocalDate.now());
    long expirees = cotisationRepo.findByStatutOrderByDatePaiementDesc("EXPIREE",
        PageRequest.of(0, 1)).getTotalElements();
    double montant = cotisationRepo.sumMontantActives().doubleValue();
    return new StatsDto(actives, expirees, montant);
  }

  @GetMapping("/utilisateur/{utilisateurId}/active")
  public Map<String, Object> cotisationActive(@PathVariable Long utilisateurId) {
    var opt = cotisationRepo.findTopByUtilisateurIdAndStatutOrderByDateFinDesc(utilisateurId, "ACTIVE");
    if (opt.isEmpty()) return Map.of("active", false);
    Cotisation c = opt.get();
    boolean valide = !c.getDateFin().isBefore(LocalDate.now());
    return Map.of("active", valide, "dateFin", c.getDateFin().toString(),
        "montant", c.getMontant().doubleValue());
  }

  // ─── Mapper ──────────────────────────────────────────────────────────────

  private CotisationDto toDto(Cotisation c) {
    String nom = c.getUtilisateur().getPrenom() + " " + c.getUtilisateur().getNom();
    return new CotisationDto(c.getId(), c.getUtilisateur().getId(), nom,
        c.getUtilisateur().getEmail(), c.getMontant().doubleValue(),
        c.getDateDebut().toString(), c.getDateFin().toString(),
        c.getStatut(), c.getNotes(),
        c.getDatePaiement() != null ? c.getDatePaiement().toString() : null);
  }
}
