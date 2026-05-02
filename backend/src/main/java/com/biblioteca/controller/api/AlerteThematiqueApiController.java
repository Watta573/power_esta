package com.biblioteca.controller.api;

import com.biblioteca.entity.AlerteThematique;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.repository.AlerteThematiqueRepository;
import com.biblioteca.repository.UtilisateurRepository;
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

  @GetMapping
  public List<AlerteThematique> getMesAlertes(@RequestParam Long utilisateurId) {
    return alerteRepo.findByUtilisateurId(utilisateurId);
  }

  @PostMapping
  @Transactional
  public AlerteThematique creer(@RequestParam Long utilisateurId, @RequestBody AlerteRequest req) {
    if (alerteRepo.existsByUtilisateurIdAndTypeAlerteAndValeur(utilisateurId, req.typeAlerte(), req.valeur()))
      throw new com.biblioteca.exception.BusinessException("Alerte déjà existante");

    Utilisateur u = utilisateurRepo.findById(utilisateurId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Utilisateur introuvable"));

    return alerteRepo.save(AlerteThematique.builder()
        .utilisateur(u)
        .typeAlerte(req.typeAlerte())
        .valeur(req.valeur())
        .build());
  }

  @DeleteMapping("/{id}")
  @Transactional
  public Map<String, String> supprimer(@PathVariable Long id, @RequestParam Long utilisateurId) {
    alerteRepo.deleteByUtilisateurIdAndId(utilisateurId, id);
    return Map.of("status", "ok");
  }
}
