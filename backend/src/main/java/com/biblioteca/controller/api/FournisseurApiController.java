package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.CommandeAchat;
import com.biblioteca.entity.Fournisseur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CommandeAchatRepository;
import com.biblioteca.repository.FournisseurRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/fournisseurs", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
public class FournisseurApiController {

  private final FournisseurRepository fournisseurRepo;
  private final CommandeAchatRepository commandeRepo;

  public FournisseurApiController(FournisseurRepository fournisseurRepo,
                                   CommandeAchatRepository commandeRepo) {
    this.fournisseurRepo = fournisseurRepo;
    this.commandeRepo = commandeRepo;
  }

  // ─── DTOs ────────────────────────────────────────────────────────────────

  public record FournisseurDto(Long id, String nom, String email, String telephone,
                                String adresse, String contactNom, String notes,
                                boolean actif, String dateCreation, long nbCommandes) {}

  public record FournisseurRequest(
      @NotBlank String nom,
      String email, String telephone, String adresse,
      String contactNom, String notes) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────

  @GetMapping
  public PageResponseDto<FournisseurDto> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String q) {
    var pageable = PageRequest.of(page, size, Sort.by("nom"));
    var result = (q != null && !q.isBlank())
        ? fournisseurRepo.search(q, pageable)
        : fournisseurRepo.findByActifTrueOrderByNomAsc(pageable);
    return PageResponseDto.from(result.map(this::toDto));
  }

  @GetMapping("/all")
  public List<FournisseurDto> listAll() {
    return fournisseurRepo.findByActifTrueOrderByNomAsc(PageRequest.of(0, 200))
        .map(this::toDto).toList();
  }

  @GetMapping("/{id}")
  public FournisseurDto getById(@PathVariable Long id) {
    return toDto(fournisseurRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Fournisseur introuvable")));
  }

  @PostMapping
  public ResponseEntity<FournisseurDto> create(@Valid @RequestBody FournisseurRequest req) {
    Fournisseur f = Fournisseur.builder()
        .nom(req.nom()).email(req.email()).telephone(req.telephone())
        .adresse(req.adresse()).contactNom(req.contactNom()).notes(req.notes())
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(fournisseurRepo.save(f)));
  }

  @PutMapping("/{id}")
  public FournisseurDto update(@PathVariable Long id, @Valid @RequestBody FournisseurRequest req) {
    Fournisseur f = fournisseurRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Fournisseur introuvable"));
    f.setNom(req.nom()); f.setEmail(req.email()); f.setTelephone(req.telephone());
    f.setAdresse(req.adresse()); f.setContactNom(req.contactNom()); f.setNotes(req.notes());
    return toDto(fournisseurRepo.save(f));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    Fournisseur f = fournisseurRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Fournisseur introuvable"));
    f.setActif(false);
    fournisseurRepo.save(f);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{id}/commandes/{commandeId}/lier")
  public Map<String, String> lierCommande(@PathVariable Long id, @PathVariable Long commandeId) {
    Fournisseur f = fournisseurRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Fournisseur introuvable"));
    CommandeAchat c = commandeRepo.findById(commandeId)
        .orElseThrow(() -> new BusinessException("Commande introuvable"));
    c.setFournisseurEntity(f);
    commandeRepo.save(c);
    return Map.of("status", "ok");
  }

  // ─── Mapper ──────────────────────────────────────────────────────────────

  private FournisseurDto toDto(Fournisseur f) {
    long nbCommandes = commandeRepo.countByFournisseurEntity(f);
    return new FournisseurDto(f.getId(), f.getNom(), f.getEmail(), f.getTelephone(),
        f.getAdresse(), f.getContactNom(), f.getNotes(),
        Boolean.TRUE.equals(f.getActif()),
        f.getDateCreation() != null ? f.getDateCreation().toString() : null,
        nbCommandes);
  }
}
