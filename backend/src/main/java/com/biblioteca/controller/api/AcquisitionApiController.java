package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.CommandeAchat;
import com.biblioteca.entity.SuggestionAchat;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CommandeAchatRepository;
import com.biblioteca.repository.SuggestionAchatRepository;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.repository.UtilisateurRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.biblioteca.security.RequirePermission;

@RestController
@RequestMapping(value = "/api/acquisitions", produces = MediaType.APPLICATION_JSON_VALUE)
public class AcquisitionApiController {

  private final SuggestionAchatRepository suggestionRepo;
  private final CommandeAchatRepository commandeRepo;
  private final UtilisateurRepository utilisateurRepo;

  public AcquisitionApiController(SuggestionAchatRepository suggestionRepo,
                                   CommandeAchatRepository commandeRepo,
                                   UtilisateurRepository utilisateurRepo) {
    this.suggestionRepo = suggestionRepo;
    this.commandeRepo = commandeRepo;
    this.utilisateurRepo = utilisateurRepo;
  }

  // ─── DTOs ────────────────────────────────────────────────────────────────

  public record SuggestionDto(Long id, String titre, String auteur, String isbn,
                               String demandeur, String justification, String statut,
                               String dateDemande) {}

  public record CommandeDto(Long id, String fournisseur, int nbTitres, double montant,
                             String dateCommande, String dateLivraison, String statut, String notes) {}

  public record SuggestionRequest(
      @NotBlank String titre,
      String auteur,
      String isbn,
      String justification) {}

  public record CommandeRequest(
      @NotBlank String fournisseur,
      @NotNull @Positive int nbTitres,
      @NotNull @Positive double montant,
      String notes) {}

  public record StatsDto(long totalSuggestions, long enAttente, long approuvees,
                          long totalCommandes, double montantLivrees, double montantEnCours) {}

  // ─── Suggestions ─────────────────────────────────────────────────────────

  @GetMapping("/suggestions")
  @Transactional(readOnly = true)
  @RequirePermission("ACQUISITIONS_VIEW")
  public PageResponseDto<SuggestionDto> getSuggestions(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String statut,
      @AuthenticationPrincipal String email) {
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateDemande"));
    Utilisateur moi = utilisateurRepo.findByEmail(email)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    if (isStaff) {
      // Staff : toutes les suggestions
      var p = statut != null
          ? suggestionRepo.findByStatutOrderByDateDemandeDesc(statut, pageable)
          : suggestionRepo.findAllByOrderByDateDemandeDesc(pageable);
      return PageResponseDto.from(p.map(this::toSuggestionDto));
    } else {
      // Non-staff : uniquement ses propres suggestions
      var p = statut != null
          ? suggestionRepo.findByDemandeurIdAndStatutOrderByDateDemandeDesc(moi.getId(), statut, pageable)
          : suggestionRepo.findByDemandeurIdOrderByDateDemandeDesc(moi.getId(), pageable);
      return PageResponseDto.from(p.map(this::toSuggestionDto));
    }
  }

  @PostMapping("/suggestions")
  @Transactional
  @RequirePermission("ACQUISITIONS_SUGGEST")
  public ResponseEntity<SuggestionDto> creerSuggestion(
      @Valid @RequestBody SuggestionRequest req,
      @AuthenticationPrincipal String email) {
    Utilisateur demandeur = utilisateurRepo.findByEmail(email)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    SuggestionAchat s = SuggestionAchat.builder()
        .titre(req.titre())
        .auteur(req.auteur())
        .isbn(req.isbn())
        .demandeur(demandeur)
        .justification(req.justification())
        .statut("EN_ATTENTE")
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(toSuggestionDto(suggestionRepo.save(s)));
  }

  @PutMapping("/suggestions/{id}/statut")
  @Transactional
  @RequirePermission("ACQUISITIONS_APPROVE")
  public SuggestionDto changerStatutSuggestion(@PathVariable Long id,
                                                @RequestParam String statut) {
    SuggestionAchat s = suggestionRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Suggestion introuvable"));
    s.setStatut(statut);
    s.setDateTraitement(LocalDateTime.now());
    return toSuggestionDto(suggestionRepo.save(s));
  }

  // ─── Commandes ───────────────────────────────────────────────────────────

  @GetMapping("/commandes")
  @RequirePermission("ACQUISITIONS_ORDERS_VIEW")
  public PageResponseDto<CommandeDto> getCommandes(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCommande"));
    return PageResponseDto.from(commandeRepo.findAllByOrderByDateCommandeDesc(pageable).map(this::toCommandeDto));
  }

  @PostMapping("/commandes")
  @RequirePermission("ACQUISITIONS_ORDERS_CREATE")
  public ResponseEntity<CommandeDto> creerCommande(@Valid @RequestBody CommandeRequest req) {
    CommandeAchat c = CommandeAchat.builder()
        .fournisseur(req.fournisseur())
        .nbTitres(req.nbTitres())
        .montant(BigDecimal.valueOf(req.montant()))
        .statut("EN_COURS")
        .notes(req.notes())
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(toCommandeDto(commandeRepo.save(c)));
  }

  @PutMapping("/commandes/{id}/livrer")
  @RequirePermission("ACQUISITIONS_DELIVERY")
  public CommandeDto marquerLivree(@PathVariable Long id) {
    CommandeAchat c = commandeRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Commande introuvable"));
    c.setStatut("LIVREE");
    c.setDateLivraison(LocalDate.now());
    return toCommandeDto(commandeRepo.save(c));
  }

  @PutMapping("/commandes/{id}/annuler")
  @RequirePermission("ACQUISITIONS_ORDERS_CANCEL")
  public CommandeDto annulerCommande(@PathVariable Long id) {
    CommandeAchat c = commandeRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Commande introuvable"));
    c.setStatut("ANNULEE");
    return toCommandeDto(commandeRepo.save(c));
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  @GetMapping("/stats")
  @RequirePermission("ACQUISITIONS_VIEW")
  public StatsDto getStats(@AuthenticationPrincipal String email) {
    Utilisateur moi = utilisateurRepo.findByEmail(email)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    if (isStaff) {
      long total = suggestionRepo.count();
      long enAttente = suggestionRepo.findByStatutOrderByDateDemandeDesc("EN_ATTENTE", PageRequest.of(0, 1)).getTotalElements();
      long approuvees = suggestionRepo.findByStatutOrderByDateDemandeDesc("APPROUVE", PageRequest.of(0, 1)).getTotalElements();
      long totalCommandes = commandeRepo.count();
      double livrees = commandeRepo.sumMontantLivrees().doubleValue();
      double enCours = commandeRepo.sumMontantEnCours().doubleValue();
      return new StatsDto(total, enAttente, approuvees, totalCommandes, livrees, enCours);
    } else {
      long total = suggestionRepo.findByDemandeurIdOrderByDateDemandeDesc(moi.getId(), PageRequest.of(0, 1)).getTotalElements();
      long enAttente = suggestionRepo.findByDemandeurIdAndStatutOrderByDateDemandeDesc(moi.getId(), "EN_ATTENTE", PageRequest.of(0, 1)).getTotalElements();
      long approuvees = suggestionRepo.findByDemandeurIdAndStatutOrderByDateDemandeDesc(moi.getId(), "APPROUVE", PageRequest.of(0, 1)).getTotalElements();
      return new StatsDto(total, enAttente, approuvees, 0, 0, 0);
    }
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private SuggestionDto toSuggestionDto(SuggestionAchat s) {
    String demandeur = s.getDemandeur() != null
        ? s.getDemandeur().getPrenom() + " " + s.getDemandeur().getNom()
        : "—";
    return new SuggestionDto(s.getId(), s.getTitre(), s.getAuteur(), s.getIsbn(),
        demandeur, s.getJustification(), s.getStatut(),
        s.getDateDemande() != null ? s.getDateDemande().toString() : null);
  }

  private CommandeDto toCommandeDto(CommandeAchat c) {
    return new CommandeDto(c.getId(), c.getFournisseur(), c.getNbTitres(),
        c.getMontant().doubleValue(),
        c.getDateCommande() != null ? c.getDateCommande().toString() : null,
        c.getDateLivraison() != null ? c.getDateLivraison().toString() : null,
        c.getStatut(), c.getNotes());
  }
}
