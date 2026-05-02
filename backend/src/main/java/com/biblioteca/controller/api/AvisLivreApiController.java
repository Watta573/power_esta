package com.biblioteca.controller.api;

import com.biblioteca.entity.AvisLivre;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.repository.AvisLivreRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.UtilisateurRepository;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
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

  public record AvisRequest(int note, String commentaire) {}

  // Avis d'un livre (public)
  @GetMapping("/livre/{livreId}")
  public Map<String, Object> getAvisLivre(
      @PathVariable Long livreId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    Page<AvisLivre> avis = avisRepo.findByLivreIdOrderByDateAvisDesc(livreId, PageRequest.of(page, size));
    double moyenne = avisRepo.avgNoteByLivreId(livreId);
    long total = avisRepo.countByLivreId(livreId);
    return Map.of("avis", avis, "moyenne", Math.round(moyenne * 10.0) / 10.0, "total", total);
  }

  // Mon avis sur un livre
  @GetMapping("/mon-avis")
  @PreAuthorize("isAuthenticated()")
  public Map<String, Object> getMonAvis(@RequestParam Long utilisateurId, @RequestParam Long livreId) {
    return avisRepo.findByUtilisateurIdAndLivreId(utilisateurId, livreId)
        .map(a -> Map.<String, Object>of("avis", a, "existe", true))
        .orElse(Map.of("existe", false));
  }

  // Créer ou mettre à jour un avis
  @PostMapping("/livre/{livreId}")
  @PreAuthorize("hasAnyRole('ETUDIANT','ENSEIGNANT','PUBLIC','ADMIN','BIBLIOTHECAIRE')")
  public AvisLivre creerOuMettreAJour(@PathVariable Long livreId,
                                       @RequestParam Long utilisateurId,
                                       @RequestBody AvisRequest req) {
    if (req.note() < 1 || req.note() > 5)
      throw new com.biblioteca.exception.BusinessException("La note doit être entre 1 et 5");

    Utilisateur u = utilisateurRepo.findById(utilisateurId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Utilisateur introuvable"));
    Livre l = livreRepo.findById(livreId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Livre introuvable"));

    AvisLivre avis = avisRepo.findByUtilisateurIdAndLivreId(utilisateurId, livreId)
        .orElse(AvisLivre.builder().utilisateur(u).livre(l).build());
    avis.setNote(req.note());
    avis.setCommentaire(req.commentaire());
    return avisRepo.save(avis);
  }

  // Supprimer son avis
  @DeleteMapping("/livre/{livreId}")
  @PreAuthorize("isAuthenticated()")
  public Map<String, String> supprimer(@PathVariable Long livreId, @RequestParam Long utilisateurId) {
    avisRepo.findByUtilisateurIdAndLivreId(utilisateurId, livreId)
        .ifPresent(avisRepo::delete);
    return Map.of("status", "ok");
  }

  // Admin : tous les avis
  @GetMapping("/admin/tous")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public Page<AvisLivre> tousLesAvis(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return avisRepo.findAllByOrderByDateAvisDesc(PageRequest.of(page, size));
  }

  // Admin : supprimer un avis
  @DeleteMapping("/admin/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public Map<String, String> supprimerAdmin(@PathVariable Long id) {
    avisRepo.deleteById(id);
    return Map.of("status", "ok");
  }
}
