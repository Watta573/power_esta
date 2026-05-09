package com.biblioteca.controller.api;

import com.biblioteca.entity.AlerteThematique;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.AlerteThematiqueRepository;
import com.biblioteca.repository.UtilisateurRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/alertes-thematiques", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("isAuthenticated()")
public class AlerteThematiqueApiController {

  private final AlerteThematiqueRepository alerteRepo;
  private final UtilisateurRepository utilisateurRepo;

  public AlerteThematiqueApiController(AlerteThematiqueRepository alerteRepo,
                                        UtilisateurRepository utilisateurRepo) {
    this.alerteRepo = alerteRepo;
    this.utilisateurRepo = utilisateurRepo;
  }

  public record AlerteRequest(String typeAlerte, String valeur) {}

  public record AlerteDto(Long id, String typeAlerte, String valeur, LocalDateTime dateCreation) {}

  @GetMapping
  @Transactional(readOnly = true)
  public List<AlerteDto> getMesAlertes(@RequestParam Long utilisateurId) {
    return alerteRepo.findByUtilisateurId(utilisateurId)
        .stream()
        .map(a -> new AlerteDto(a.getId(), a.getTypeAlerte(), a.getValeur(), a.getDateCreation()))
        .toList();
  }

  @PostMapping
  @Transactional
  public AlerteDto creer(@RequestParam Long utilisateurId, @RequestBody AlerteRequest req) {
    if (alerteRepo.existsByUtilisateurIdAndTypeAlerteAndValeur(utilisateurId, req.typeAlerte(), req.valeur()))
      throw new BusinessException("Alerte déjà existante");

    Utilisateur u = utilisateurRepo.findById(utilisateurId)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

    AlerteThematique saved = alerteRepo.save(AlerteThematique.builder()
        .utilisateur(u)
        .typeAlerte(req.typeAlerte())
        .valeur(req.valeur())
        .build());

    return new AlerteDto(saved.getId(), saved.getTypeAlerte(), saved.getValeur(), saved.getDateCreation());
  }

  @DeleteMapping("/{id}")
  @Transactional
  public Map<String, String> supprimer(@PathVariable Long id, @RequestParam Long utilisateurId) {
    alerteRepo.deleteByUtilisateurIdAndId(utilisateurId, id);
    return Map.of("status", "ok");
  }
}
