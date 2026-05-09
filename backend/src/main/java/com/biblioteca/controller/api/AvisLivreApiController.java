package com.biblioteca.controller.api;

import com.biblioteca.entity.AvisLivre;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.AvisLivreRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.UtilisateurRepository;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/avis", produces = MediaType.APPLICATION_JSON_VALUE)
public class AvisLivreApiController {

  private final AvisLivreRepository avisRepo;
  private final LivreRepository livreRepo;
  private final UtilisateurRepository utilisateurRepo;

  public AvisLivreApiController(AvisLivreRepository avisRepo,
                                 LivreRepository livreRepo,
                                 UtilisateurRepository utilisateurRepo) {
    this.avisRepo = avisRepo;
    this.livreRepo = livreRepo;
    this.utilisateurRepo = utilisateurRepo;
  }

  // ── DTOs ────────────────────────────────────────────────────────────────

  public record AvisRequest(int note, String commentaire) {}

  public record UtilisateurAvisDto(Long id, String prenom, String nom, String identifiant) {}
  public record LivreAvisDto(Long id, String titre) {}
  public record AvisDto(Long id, UtilisateurAvisDto utilisateur, LivreAvisDto livre,
                        int note, String commentaire, LocalDateTime dateAvis) {}

  private AvisDto toDto(AvisLivre a) {
    return new AvisDto(
        a.getId(),
        new UtilisateurAvisDto(a.getUtilisateur().getId(), a.getUtilisateur().getPrenom(),
            a.getUtilisateur().getNom(), a.getUtilisateur().getIdentifiant()),
        new LivreAvisDto(a.getLivre().getId(), a.getLivre().getTitre()),
        a.getNote(), a.getCommentaire(), a.getDateAvis());
  }

  // ── Endpoints ───────────────────────────────────────────────────────────

  @GetMapping("/livre/{livreId}")
  @Transactional(readOnly = true)
  public Map<String, Object> getAvisLivre(
      @PathVariable Long livreId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    Page<AvisLivre> raw = avisRepo.findByLivreIdOrderByDateAvisDesc(livreId, PageRequest.of(page, size));
    Page<AvisDto> avis = new PageImpl<>(raw.getContent().stream().map(this::toDto).toList(),
        raw.getPageable(), raw.getTotalElements());
    double moyenne = avisRepo.avgNoteByLivreId(livreId);
    long total = avisRepo.countByLivreId(livreId);
    return Map.of("avis", avis, "moyenne", Math.round(moyenne * 10.0) / 10.0, "total", total);
  }

  @GetMapping("/mon-avis")
  @PreAuthorize("isAuthenticated()")
  @Transactional(readOnly = true)
  public Map<String, Object> getMonAvis(@RequestParam Long utilisateurId, @RequestParam Long livreId) {
    return avisRepo.findByUtilisateurIdAndLivreId(utilisateurId, livreId)
        .map(a -> Map.<String, Object>of("avis", toDto(a), "existe", true))
        .orElse(Map.of("existe", false));
  }

  @PostMapping("/livre/{livreId}")
  @PreAuthorize("hasAnyRole('ETUDIANT','ENSEIGNANT','PUBLIC','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public AvisDto creerOuMettreAJour(@PathVariable Long livreId,
                                     @RequestParam Long utilisateurId,
                                     @RequestBody AvisRequest req) {
    if (req.note() < 1 || req.note() > 5)
      throw new BusinessException("La note doit être entre 1 et 5");

    Utilisateur u = utilisateurRepo.findById(utilisateurId)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    Livre l = livreRepo.findById(livreId)
        .orElseThrow(() -> new BusinessException("Livre introuvable"));

    AvisLivre avis = avisRepo.findByUtilisateurIdAndLivreId(utilisateurId, livreId)
        .orElse(AvisLivre.builder().utilisateur(u).livre(l).build());
    avis.setNote(req.note());
    avis.setCommentaire(req.commentaire());
    return toDto(avisRepo.save(avis));
  }

  @DeleteMapping("/livre/{livreId}")
  @PreAuthorize("isAuthenticated()")
  @Transactional
  public Map<String, String> supprimer(@PathVariable Long livreId, @RequestParam Long utilisateurId) {
    avisRepo.findByUtilisateurIdAndLivreId(utilisateurId, livreId).ifPresent(avisRepo::delete);
    return Map.of("status", "ok");
  }

  @GetMapping("/admin/tous")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  @Transactional(readOnly = true)
  public Page<AvisDto> tousLesAvis(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Page<AvisLivre> raw = avisRepo.findAllByOrderByDateAvisDesc(PageRequest.of(page, size));
    return new PageImpl<>(raw.getContent().stream().map(this::toDto).toList(),
        raw.getPageable(), raw.getTotalElements());
  }

  @DeleteMapping("/admin/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public Map<String, String> supprimerAdmin(@PathVariable Long id) {
    avisRepo.deleteById(id);
    return Map.of("status", "ok");
  }
}
