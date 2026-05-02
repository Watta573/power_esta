package com.biblioteca.controller.api;

import com.biblioteca.entity.Emprunt;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.ReservationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.repository.AvisLivreRepository;
import com.biblioteca.repository.WishlistItemRepository;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/espace-membre", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("isAuthenticated()")
public class EspaceMembreApiController {

  private final UtilisateurRepository utilisateurRepo;
  private final EmpruntRepository empruntRepo;
  private final ReservationRepository reservationRepo;
  private final AvisLivreRepository avisRepo;
  private final WishlistItemRepository wishlistRepo;

  public EspaceMembreApiController(UtilisateurRepository utilisateurRepo,
                                    EmpruntRepository empruntRepo,
                                    ReservationRepository reservationRepo,
                                    AvisLivreRepository avisRepo,
                                    WishlistItemRepository wishlistRepo) {
    this.utilisateurRepo = utilisateurRepo;
    this.empruntRepo = empruntRepo;
    this.reservationRepo = reservationRepo;
    this.avisRepo = avisRepo;
    this.wishlistRepo = wishlistRepo;
  }

  // ── Carte membre numérique + stats personnelles ──────────────────────────
  @GetMapping("/carte/{utilisateurId}")
  public Map<String, Object> getCarteMembre(@PathVariable Long utilisateurId) {
    Utilisateur u = utilisateurRepo.findById(utilisateurId)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

    long empruntsEnCours = empruntRepo.countByUtilisateurIdAndStatut(utilisateurId, StatutEmprunt.EN_COURS);
    long empruntsRetard  = empruntRepo.countByUtilisateurIdAndStatut(utilisateurId, StatutEmprunt.EN_RETARD);
    List<Emprunt> tous   = empruntRepo.findByUtilisateurIdOrderByDateEmpruntDesc(utilisateurId);

    double amendesDues = tous.stream()
        .filter(e -> e.getStatut() == StatutEmprunt.EN_RETARD)
        .mapToDouble(e -> e.getAmende() != null ? e.getAmende().doubleValue() : 0)
        .sum();

    long empruntsAnnee = tous.stream()
        .filter(e -> e.getDateEmprunt() != null && e.getDateEmprunt().getYear() == LocalDate.now().getYear())
        .count();

    // Genres préférés (top 3 catégories)
    Map<String, Long> genresCount = tous.stream()
        .filter(e -> e.getExemplaire() != null && e.getExemplaire().getLivre() != null
                  && e.getExemplaire().getLivre().getCategorie() != null)
        .collect(Collectors.groupingBy(
            e -> e.getExemplaire().getLivre().getCategorie().getNom(),
            Collectors.counting()
        ));
    List<String> genresPreferes = genresCount.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(3)
        .map(Map.Entry::getKey)
        .collect(Collectors.toList());

    // Auteurs les plus empruntés (top 3)
    Map<String, Long> auteursCount = tous.stream()
        .filter(e -> e.getExemplaire() != null && e.getExemplaire().getLivre() != null)
        .collect(Collectors.groupingBy(
            e -> e.getExemplaire().getLivre().getAuteur(),
            Collectors.counting()
        ));
    List<String> auteursPreferes = auteursCount.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(3)
        .map(Map.Entry::getKey)
        .collect(Collectors.toList());

    // Quota selon rôle
    int quotaMax = switch (u.getRole()) {
      case ENSEIGNANT -> 10;
      case ETUDIANT   -> 3;
      case PUBLIC     -> 1;
      default         -> 5;
    };

    return Map.of(
        "utilisateur", Map.of(
            "id", u.getId(),
            "nom", u.getNom(),
            "prenom", u.getPrenom(),
            "identifiant", u.getIdentifiant(),
            "email", u.getEmail(),
            "role", u.getRole().name(),
            "dateInscription", u.getDateInscription().toString(),
            "actif", u.getActif()
        ),
        "stats", Map.of(
            "empruntsEnCours", empruntsEnCours,
            "empruntsEnRetard", empruntsRetard,
            "totalEmprunts", tous.size(),
            "amendesDues", amendesDues,
            "membreDepuis", u.getDateInscription().toString(),
            "anneeEnCours", LocalDate.now().getYear(),
            "empruntsAnneeEnCours", empruntsAnnee,
            "quotaMax", quotaMax,
            "genresPreferes", genresPreferes,
            "auteursPreferes", auteursPreferes
        )
    );
  }

  // ── Historique complet des emprunts ──────────────────────────────────────
  @GetMapping("/historique/{utilisateurId}")
  public Map<String, Object> getHistorique(
      @PathVariable Long utilisateurId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @AuthenticationPrincipal String email) {

    Utilisateur moi = utilisateurRepo.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    // Non-staff ne peut voir que son propre historique
    if (!isStaff && !moi.getId().equals(utilisateurId)) {
      throw new org.springframework.security.access.AccessDeniedException("Accès refusé");
    }

    var pageable = PageRequest.of(Math.max(page, 0), Math.min(size, 50));
    var pageResult = empruntRepo.findByUtilisateurId(utilisateurId, pageable);

    List<Map<String, Object>> content = pageResult.getContent().stream().map(e -> {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("id", e.getId());
      m.put("titre", e.getExemplaire() != null && e.getExemplaire().getLivre() != null
          ? e.getExemplaire().getLivre().getTitre() : "—");
      m.put("auteur", e.getExemplaire() != null && e.getExemplaire().getLivre() != null
          ? e.getExemplaire().getLivre().getAuteur() : "—");
      m.put("codeExemplaire", e.getExemplaire() != null ? e.getExemplaire().getCodeExemplaire() : "—");
      m.put("dateEmprunt", e.getDateEmprunt() != null ? e.getDateEmprunt().toString() : null);
      m.put("dateRetourPrevue", e.getDateRetourPrevue() != null ? e.getDateRetourPrevue().toString() : null);
      m.put("dateRetourEffective", e.getDateRetourEffective() != null ? e.getDateRetourEffective().toString() : null);
      m.put("statut", e.getStatut().name());
      m.put("amende", e.getAmende() != null ? e.getAmende().doubleValue() : 0);
      m.put("nombreRenouvellements", e.getNombreRenouvellements());
      return m;
    }).collect(Collectors.toList());

    return Map.of(
        "content", content,
        "totalElements", pageResult.getTotalElements(),
        "totalPages", pageResult.getTotalPages(),
        "number", pageResult.getNumber(),
        "size", pageResult.getSize()
    );
  }

  // ── Amendes en cours + historique paiements ───────────────────────────────
  @GetMapping("/amendes/{utilisateurId}")
  public Map<String, Object> getAmendes(@PathVariable Long utilisateurId,
                                         @AuthenticationPrincipal String email) {
    Utilisateur moi = utilisateurRepo.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    if (!isStaff && !moi.getId().equals(utilisateurId)) {
      throw new org.springframework.security.access.AccessDeniedException("Accès refusé");
    }

    List<Emprunt> tous = empruntRepo.findByUtilisateurIdOrderByDateEmpruntDesc(utilisateurId);

    List<Map<String, Object>> amendesEnCours = tous.stream()
        .filter(e -> e.getStatut() == StatutEmprunt.EN_RETARD && e.getAmende() != null
                  && e.getAmende().doubleValue() > 0)
        .map(e -> Map.<String, Object>of(
            "empruntId", e.getId(),
            "titre", e.getExemplaire().getLivre().getTitre(),
            "montant", e.getAmende().doubleValue(),
            "joursRetard", java.time.temporal.ChronoUnit.DAYS.between(e.getDateRetourPrevue(), LocalDate.now()),
            "dateRetourPrevue", e.getDateRetourPrevue().toString()
        ))
        .collect(Collectors.toList());

    double totalDu = amendesEnCours.stream()
        .mapToDouble(m -> ((Number) m.get("montant")).doubleValue())
        .sum();

    List<Map<String, Object>> historiquePaiements = tous.stream()
        .filter(e -> e.getStatut() == StatutEmprunt.RETOURNE && e.getAmende() != null
                  && e.getAmende().doubleValue() > 0)
        .map(e -> Map.<String, Object>of(
            "empruntId", e.getId(),
            "titre", e.getExemplaire().getLivre().getTitre(),
            "montant", e.getAmende().doubleValue(),
            "dateRetour", e.getDateRetourEffective() != null ? e.getDateRetourEffective().toString() : "—"
        ))
        .collect(Collectors.toList());

    return Map.of(
        "amendesEnCours", amendesEnCours,
        "totalDu", totalDu,
        "historiquePaiements", historiquePaiements
    );
  }

  // ── Statistiques personnelles ─────────────────────────────────────────────
  @GetMapping("/statistiques/{utilisateurId}")
  public Map<String, Object> getStatistiques(@PathVariable Long utilisateurId,
                                              @AuthenticationPrincipal String email) {
    Utilisateur moi = utilisateurRepo.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    if (!isStaff && !moi.getId().equals(utilisateurId)) {
      throw new org.springframework.security.access.AccessDeniedException("Accès refusé");
    }

    List<Emprunt> tous = empruntRepo.findByUtilisateurIdOrderByDateEmpruntDesc(utilisateurId);
    int annee = LocalDate.now().getYear();

    long empruntsAnnee = tous.stream()
        .filter(e -> e.getDateEmprunt() != null && e.getDateEmprunt().getYear() == annee)
        .count();

    // Emprunts par mois (12 derniers mois)
    Map<String, Long> parMois = new LinkedHashMap<>();
    for (int i = 11; i >= 0; i--) {
      LocalDate mois = LocalDate.now().minusMonths(i);
      String key = mois.getYear() + "-" + String.format("%02d", mois.getMonthValue());
      long count = tous.stream()
          .filter(e -> e.getDateEmprunt() != null
              && e.getDateEmprunt().getYear() == mois.getYear()
              && e.getDateEmprunt().getMonthValue() == mois.getMonthValue())
          .count();
      parMois.put(key, count);
    }

    // Top catégories
    Map<String, Long> parCategorie = tous.stream()
        .filter(e -> e.getExemplaire() != null && e.getExemplaire().getLivre() != null
                  && e.getExemplaire().getLivre().getCategorie() != null)
        .collect(Collectors.groupingBy(
            e -> e.getExemplaire().getLivre().getCategorie().getNom(),
            Collectors.counting()
        ));

    // Top auteurs
    Map<String, Long> parAuteur = tous.stream()
        .filter(e -> e.getExemplaire() != null && e.getExemplaire().getLivre() != null)
        .collect(Collectors.groupingBy(
            e -> e.getExemplaire().getLivre().getAuteur(),
            Collectors.counting()
        ));

    long retards = tous.stream().filter(e -> e.getStatut() == StatutEmprunt.EN_RETARD
        || (e.getStatut() == StatutEmprunt.RETOURNE && e.getAmende() != null
            && e.getAmende().doubleValue() > 0)).count();

    return Map.of(
        "totalEmprunts", tous.size(),
        "empruntsAnneeEnCours", empruntsAnnee,
        "empruntsParMois", parMois,
        "topCategories", parCategorie,
        "topAuteurs", parAuteur,
        "nombreRetards", retards
    );
  }
}
