package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.NumeroPeriodique;
import com.biblioteca.entity.Periodique;
import com.biblioteca.entity.enums.StatutNumeroPeriodique;
import com.biblioteca.entity.enums.TypePeriodique;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.NumeroPeriodiqueRepository;
import com.biblioteca.repository.PeriodiqueRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/periodiques", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
public class PeriodiqueApiController {

  private final PeriodiqueRepository periodiqueRepo;
  private final NumeroPeriodiqueRepository numeroRepo;

  public PeriodiqueApiController(PeriodiqueRepository periodiqueRepo,
                                  NumeroPeriodiqueRepository numeroRepo) {
    this.periodiqueRepo = periodiqueRepo;
    this.numeroRepo = numeroRepo;
  }

  // ─── DTOs ────────────────────────────────────────────────────────────────

  public record PeriodiqueDto(Long id, String titre, String issn, String editeur,
                               String langue, String frequence, String description,
                               String couverture, String type, String accesNumerique,
                               String licenceAcces, boolean actif, String dateAjout) {}

  public record NumeroDto(Long id, Long periodiqueId, String titrePeriodique,
                           String volume, String numero, String dateParution,
                           boolean disponible, String statut, String localisation,
                           String notes, String dateReception) {}

  public record PeriodiqueRequest(
      @NotBlank String titre,
      String issn, String editeur, String langue, String frequence,
      String description, String couverture, String type,
      String accesNumerique, String licenceAcces) {}

  public record NumeroRequest(
      @NotNull Long periodiqueId,
      String volume,
      @NotBlank String numero,
      @NotNull String dateParution,
      boolean disponible,
      String statut,
      String localisation, String notes) {}

  // ─── Périodiques ─────────────────────────────────────────────────────────

  @GetMapping
  public PageResponseDto<PeriodiqueDto> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String q) {
    var pageable = PageRequest.of(page, size, Sort.by("titre"));
    var result = (q != null && !q.isBlank())
        ? periodiqueRepo.search(q, pageable)
        : periodiqueRepo.findByActifTrueOrderByTitreAsc(pageable);
    return PageResponseDto.from(result.map(this::toDto));
  }

  @GetMapping("/{id}")
  public PeriodiqueDto getById(@PathVariable Long id) {
    return toDto(periodiqueRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Périodique introuvable")));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public ResponseEntity<PeriodiqueDto> create(@Valid @RequestBody PeriodiqueRequest req) {
    Periodique p = Periodique.builder()
        .titre(req.titre()).issn(req.issn()).editeur(req.editeur())
        .langue(req.langue()).frequence(req.frequence())
        .description(req.description()).couverture(req.couverture())
        .type(parsePeriodiqueType(req.type()))
        .accesNumerique(req.accesNumerique())
        .licenceAcces(req.licenceAcces())
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(periodiqueRepo.save(p)));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public PeriodiqueDto update(@PathVariable Long id, @Valid @RequestBody PeriodiqueRequest req) {
    Periodique p = periodiqueRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Périodique introuvable"));
    p.setTitre(req.titre()); p.setIssn(req.issn()); p.setEditeur(req.editeur());
    p.setLangue(req.langue()); p.setFrequence(req.frequence());
    p.setDescription(req.description()); p.setCouverture(req.couverture());
    if (req.type() != null && !req.type().isBlank()) {
      p.setType(parsePeriodiqueType(req.type()));
    }
    p.setAccesNumerique(req.accesNumerique());
    p.setLicenceAcces(req.licenceAcces());
    return toDto(periodiqueRepo.save(p));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    Periodique p = periodiqueRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Périodique introuvable"));
    p.setActif(false);
    periodiqueRepo.save(p);
    return ResponseEntity.noContent().build();
  }

  // ─── Numéros ─────────────────────────────────────────────────────────────

  @GetMapping("/{id}/numeros")
  public PageResponseDto<NumeroDto> listNumeros(
      @PathVariable Long id,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    var pageable = PageRequest.of(page, size);
    return PageResponseDto.from(
        numeroRepo.findByPeriodiqueIdOrderByDateParutionDesc(id, pageable).map(this::toNumeroDto));
  }

  @PostMapping("/{id}/numeros")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public ResponseEntity<NumeroDto> addNumero(@PathVariable Long id,
                                              @Valid @RequestBody NumeroRequest req) {
    Periodique p = periodiqueRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Périodique introuvable"));
    NumeroPeriodique n = NumeroPeriodique.builder()
        .periodique(p).volume(req.volume()).numero(req.numero())
        .dateParution(LocalDate.parse(req.dateParution()))
        .statut(parseNumeroStatut(req.statut()))
        .disponible(req.disponible()).localisation(req.localisation()).notes(req.notes())
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(toNumeroDto(numeroRepo.save(n)));
  }

  @PutMapping("/numeros/{numeroId}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public NumeroDto updateNumero(@PathVariable Long numeroId, @Valid @RequestBody NumeroRequest req) {
    NumeroPeriodique n = numeroRepo.findById(numeroId)
        .orElseThrow(() -> new BusinessException("Numéro introuvable"));
    n.setVolume(req.volume()); n.setNumero(req.numero());
    n.setDateParution(LocalDate.parse(req.dateParution()));
    if (req.statut() != null && !req.statut().isBlank()) {
      n.setStatut(parseNumeroStatut(req.statut()));
    }
    n.setDisponible(req.disponible()); n.setLocalisation(req.localisation()); n.setNotes(req.notes());
    return toNumeroDto(numeroRepo.save(n));
  }

  @DeleteMapping("/numeros/{numeroId}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public ResponseEntity<Void> deleteNumero(@PathVariable Long numeroId) {
    numeroRepo.deleteById(numeroId);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/numeros/{numeroId}/reception")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public NumeroDto marquerNumeroRecu(@PathVariable Long numeroId) {
    NumeroPeriodique n = numeroRepo.findById(numeroId)
        .orElseThrow(() -> new BusinessException("Numéro introuvable"));
    n.setStatut(StatutNumeroPeriodique.RECU);
    n.setDateReception(LocalDate.now());
    n.setDisponible(true);
    return toNumeroDto(numeroRepo.save(n));
  }

  @PutMapping("/numeros/{numeroId}/manquant")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public NumeroDto marquerNumeroManquant(@PathVariable Long numeroId) {
    NumeroPeriodique n = numeroRepo.findById(numeroId)
        .orElseThrow(() -> new BusinessException("Numéro introuvable"));
    n.setStatut(StatutNumeroPeriodique.MANQUANT);
    n.setDisponible(false);
    return toNumeroDto(numeroRepo.save(n));
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private PeriodiqueDto toDto(Periodique p) {
    return new PeriodiqueDto(p.getId(), p.getTitre(), p.getIssn(), p.getEditeur(),
        p.getLangue(), p.getFrequence(), p.getDescription(), p.getCouverture(),
        p.getType() != null ? p.getType().name() : null,
        p.getAccesNumerique(), p.getLicenceAcces(),
        Boolean.TRUE.equals(p.getActif()),
        p.getDateAjout() != null ? p.getDateAjout().toString() : null);
  }

  private NumeroDto toNumeroDto(NumeroPeriodique n) {
    return new NumeroDto(n.getId(),
        n.getPeriodique().getId(), n.getPeriodique().getTitre(),
        n.getVolume(), n.getNumero(),
        n.getDateParution() != null ? n.getDateParution().toString() : null,
        Boolean.TRUE.equals(n.getDisponible()),
        n.getStatut() != null ? n.getStatut().name() : null,
        n.getLocalisation(), n.getNotes(),
        n.getDateReception() != null ? n.getDateReception().toString() : null);
  }

  private StatutNumeroPeriodique parseNumeroStatut(String statut) {
    if (statut == null || statut.isBlank()) return StatutNumeroPeriodique.ATTENDU;
    try {
      return StatutNumeroPeriodique.valueOf(statut.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new BusinessException("Statut de numéro invalide : " + statut);
    }
  }

  private TypePeriodique parsePeriodiqueType(String type) {
    if (type == null || type.isBlank()) return TypePeriodique.PHYSIQUE;
    try {
      return TypePeriodique.valueOf(type.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new BusinessException("Type de périodique invalide : " + type);
    }
  }
}
