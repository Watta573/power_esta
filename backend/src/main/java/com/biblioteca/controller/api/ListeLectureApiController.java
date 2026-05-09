package com.biblioteca.controller.api;

import com.biblioteca.entity.ListeLecture;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.ListeLectureRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.UtilisateurRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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

  // ── DTOs ────────────────────────────────────────────────────────────────

  public record ListeRequest(String titre, String description, String cours, boolean publique) {}

  public record EnseignantDto(Long id, String prenom, String nom) {}

  public record LivreListeDto(Long id, String titre, String auteur, String couverture) {}

  public record ListeLectureDto(
      Long id,
      EnseignantDto enseignant,
      String titre,
      String description,
      String cours,
      boolean publique,
      LocalDateTime dateCreation,
      List<LivreListeDto> livres) {}

  // ── Mapping ─────────────────────────────────────────────────────────────

  private ListeLectureDto toDto(ListeLecture l) {
    EnseignantDto ens = new EnseignantDto(
        l.getEnseignant().getId(),
        l.getEnseignant().getPrenom(),
        l.getEnseignant().getNom());
    List<LivreListeDto> livresDto = l.getLivres().stream()
        .map(lv -> new LivreListeDto(lv.getId(), lv.getTitre(), lv.getAuteur(), lv.getCouverture()))
        .toList();
    return new ListeLectureDto(
        l.getId(), ens, l.getTitre(), l.getDescription(),
        l.getCours(), l.isPublique(), l.getDateCreation(), livresDto);
  }

  // ── Endpoints ───────────────────────────────────────────────────────────

  @GetMapping("/publiques")
  @Transactional(readOnly = true)
  public Page<ListeLectureDto> getPubliques(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    Page<ListeLecture> p = listeRepo.findByPubliqueTrue(PageRequest.of(page, size));
    return new PageImpl<>(p.getContent().stream().map(this::toDto).toList(), p.getPageable(), p.getTotalElements());
  }

  @GetMapping("/mes-listes")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional(readOnly = true)
  public List<ListeLectureDto> getMesListes(@RequestParam Long enseignantId) {
    return listeRepo.findByEnseignantIdOrderByDateCreationDesc(enseignantId)
        .stream().map(this::toDto).toList();
  }

  @GetMapping("/admin/toutes")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  @Transactional(readOnly = true)
  public Page<ListeLectureDto> toutes(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Page<ListeLecture> p = listeRepo.findAllByOrderByDateCreationDesc(PageRequest.of(page, size));
    return new PageImpl<>(p.getContent().stream().map(this::toDto).toList(), p.getPageable(), p.getTotalElements());
  }

  @GetMapping("/{id}")
  @Transactional(readOnly = true)
  public ListeLectureDto getById(@PathVariable Long id) {
    return toDto(listeRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Liste introuvable")));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ListeLectureDto creer(@RequestParam Long enseignantId, @RequestBody ListeRequest req) {
    Utilisateur u = utilisateurRepo.findById(enseignantId)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    ListeLecture saved = listeRepo.save(ListeLecture.builder()
        .enseignant(u)
        .titre(req.titre())
        .description(req.description())
        .cours(req.cours())
        .publique(req.publique())
        .build());
    return toDto(saved);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ListeLectureDto modifier(@PathVariable Long id, @RequestBody ListeRequest req) {
    ListeLecture l = listeRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Liste introuvable"));
    l.setTitre(req.titre());
    l.setDescription(req.description());
    l.setCours(req.cours());
    l.setPublique(req.publique());
    return toDto(listeRepo.save(l));
  }

  @PostMapping("/{id}/livres/{livreId}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ListeLectureDto ajouterLivre(@PathVariable Long id, @PathVariable Long livreId) {
    ListeLecture liste = listeRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Liste introuvable"));
    Livre livre = livreRepo.findById(livreId)
        .orElseThrow(() -> new BusinessException("Livre introuvable"));
    if (!liste.getLivres().contains(livre)) liste.getLivres().add(livre);
    return toDto(listeRepo.save(liste));
  }

  @DeleteMapping("/{id}/livres/{livreId}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public Map<String, String> retirerLivre(@PathVariable Long id, @PathVariable Long livreId) {
    ListeLecture liste = listeRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Liste introuvable"));
    liste.getLivres().removeIf(l -> l.getId().equals(livreId));
    listeRepo.save(liste);
    return Map.of("status", "ok");
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ENSEIGNANT','ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public Map<String, String> supprimer(@PathVariable Long id) {
    listeRepo.deleteById(id);
    return Map.of("status", "ok");
  }
}
