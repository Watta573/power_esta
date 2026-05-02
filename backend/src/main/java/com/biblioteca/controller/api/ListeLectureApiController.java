package com.biblioteca.controller.api;

import com.biblioteca.entity.ListeLecture;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.repository.ListeLectureRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.UtilisateurRepository;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/listes-lecture", produces = MediaType.APPLICATION_JSON_VALUE)
public class ListeLectureApiController {

  private final ListeLectureRepository listeRepo;
  private final LivreRepository livreRepo;
  private final UtilisateurRepository utilisateurRepo;

  public ListeLectureApiController(ListeLectureRepository listeRepo,
                                    LivreRepository livreRepo,
                                    UtilisateurRepository utilisateurRepo) {
    this.listeRepo = listeRepo;
    this.livreRepo = livreRepo;
    this.utilisateurRepo = utilisateurRepo;
  }

  public record ListeRequest(String titre, String description, String cours, boolean publique) {}

  // Listes publiques (tous les rôles)
  @GetMapping("/publiques")
  public Page<ListeLecture> getPubliques(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return listeRepo.findByPubliqueTrue(PageRequest.of(page, size));
  }

  // Mes listes (enseignant)
  @GetMapping("/mes-listes")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  public List<ListeLecture> getMesListes(@RequestParam Long enseignantId) {
    return listeRepo.findByEnseignantIdOrderByDateCreationDesc(enseignantId);
  }

  // Toutes les listes (admin/biblio)
  @GetMapping("/admin/toutes")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public Page<ListeLecture> toutes(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return listeRepo.findAllByOrderByDateCreationDesc(PageRequest.of(page, size));
  }

  // Détail d'une liste
  @GetMapping("/{id}")
  public ListeLecture getById(@PathVariable Long id) {
    return listeRepo.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Liste introuvable"));
  }

  // Créer une liste
  @PostMapping
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ListeLecture creer(@RequestParam Long enseignantId, @RequestBody ListeRequest req) {
    Utilisateur u = utilisateurRepo.findById(enseignantId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Utilisateur introuvable"));
    return listeRepo.save(ListeLecture.builder()
        .enseignant(u)
        .titre(req.titre())
        .description(req.description())
        .cours(req.cours())
        .publique(req.publique())
        .build());
  }

  // Modifier une liste
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ListeLecture modifier(@PathVariable Long id, @RequestBody ListeRequest req) {
    ListeLecture l = listeRepo.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Liste introuvable"));
    l.setTitre(req.titre());
    l.setDescription(req.description());
    l.setCours(req.cours());
    l.setPublique(req.publique());
    return listeRepo.save(l);
  }

  // Ajouter un livre à la liste
  @PostMapping("/{id}/livres/{livreId}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ListeLecture ajouterLivre(@PathVariable Long id, @PathVariable Long livreId) {
    ListeLecture liste = listeRepo.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Liste introuvable"));
    Livre livre = livreRepo.findById(livreId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Livre introuvable"));
    if (!liste.getLivres().contains(livre)) liste.getLivres().add(livre);
    return listeRepo.save(liste);
  }

  // Retirer un livre de la liste
  @DeleteMapping("/{id}/livres/{livreId}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public Map<String, String> retirerLivre(@PathVariable Long id, @PathVariable Long livreId) {
    ListeLecture liste = listeRepo.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Liste introuvable"));
    liste.getLivres().removeIf(l -> l.getId().equals(livreId));
    listeRepo.save(liste);
    return Map.of("status", "ok");
  }

  // Supprimer une liste
  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public Map<String, String> supprimer(@PathVariable Long id) {
    listeRepo.deleteById(id);
    return Map.of("status", "ok");
  }
}
