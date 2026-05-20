package com.biblioteca.controller.api;

import com.biblioteca.dto.api.LivreDto;
import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.enums.StatutReservation;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.ExemplaireRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.LivreSpecifications;
import com.biblioteca.repository.ReservationRepository;
import com.biblioteca.service.LivreService;
import com.biblioteca.util.DtoMapper;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/livres", produces = MediaType.APPLICATION_JSON_VALUE)
public class LivreApiController {

  private final LivreRepository livreRepository;
  private final LivreService livreService;
  private final DtoMapper dtoMapper;
  private final ExemplaireRepository exemplaireRepository;
  private final ReservationRepository reservationRepository;
  private final EmpruntRepository empruntRepository;

  public LivreApiController(LivreRepository livreRepository,
                             LivreService livreService,
                             DtoMapper dtoMapper,
                             ExemplaireRepository exemplaireRepository,
                             ReservationRepository reservationRepository,
                             EmpruntRepository empruntRepository) {
    this.livreRepository = livreRepository;
    this.livreService = livreService;
    this.dtoMapper = dtoMapper;
    this.exemplaireRepository = exemplaireRepository;
    this.reservationRepository = reservationRepository;
    this.empruntRepository = empruntRepository;
  }

  @GetMapping
  public PageResponseDto<LivreDto> list(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String categorie,
      @RequestParam(required = false) Long categorieId,
      @RequestParam(required = false) String auteur,
      @RequestParam(required = false) String langue,
      @RequestParam(required = false) Integer anneeMin,
      @RequestParam(required = false) Integer anneeMax,
      @RequestParam(required = false) Boolean disponibleSeulement,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {

    Specification<Livre> spec = LivreSpecifications.build(q, categorie, categorieId, auteur, langue,
        anneeMin, anneeMax, disponibleSeulement, exemplaireRepository);
    Page<Livre> livres = livreRepository.findAll(spec,
        PageRequest.of(Math.max(page, 0), Math.min(size, 100), Sort.by("titre")));
    return PageResponseDto.from(livres.map(dtoMapper::toLivreDto));
  }

  @GetMapping("/{id}")
  public LivreDto getById(@PathVariable Long id) {
    return livreRepository.findById(id)
        .map(dtoMapper::toLivreDto)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Livre introuvable"));
  }

  @GetMapping("/suggest")
  public List<String> suggest(@RequestParam String q) {
    return livreRepository.findTop10ByTitreContainingIgnoreCaseOrderByTitreAsc(q)
        .stream().map(Livre::getTitre).collect(Collectors.toList());
  }

  @GetMapping("/indisponibles")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public PageResponseDto<LivreDto> indisponibles(
      @RequestParam(required = false) String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    Specification<Livre> spec = LivreSpecifications.build(q, null, null, null, null, null, null, false, exemplaireRepository);
    Page<Livre> livres = livreRepository.findAll(spec,
        PageRequest.of(Math.max(page, 0), Math.min(size, 100), Sort.by("titre")));
    return PageResponseDto.from(livres.map(dtoMapper::toLivreDto));
  }

  @GetMapping("/{id}/exemplaires")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public List<?> getExemplaires(@PathVariable Long id) {
    return exemplaireRepository.findByLivreId(id).stream()
        .map(dtoMapper::toExemplaireDto).collect(Collectors.toList());
  }

  // ── Livres similaires (même catégorie, excluant le livre courant) ─────────
  @GetMapping("/{id}/similaires")
  public List<LivreDto> getSimilaires(@PathVariable Long id) {
    Livre livre = livreRepository.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Livre introuvable"));
    if (livre.getCategorie() == null) return List.of();

    Specification<Livre> spec = (root, query, cb) ->
        cb.and(
            cb.equal(root.get("categorie").get("id"), livre.getCategorie().getId()),
            cb.notEqual(root.get("id"), id),
            cb.isTrue(root.get("actif"))
        );
    return livreRepository.findAll(spec, PageRequest.of(0, 6, Sort.by("titre")))
        .stream().map(dtoMapper::toLivreDto).collect(Collectors.toList());
  }

  // ── Disponibilité détaillée + file d'attente ──────────────────────────────
  @GetMapping("/{id}/disponibilite")
  public Map<String, Object> getDisponibilite(@PathVariable Long id) {
    Livre livre = livreRepository.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Livre introuvable"));

    long total = exemplaireRepository.findByLivreId(id).size();
    long disponibles = exemplaireRepository.findByLivreId(id).stream()
        .filter(e -> Boolean.TRUE.equals(e.getDisponible())).count();
    long empruntes = total - disponibles;

    // Prochain retour prévu
    String prochainRetour = empruntRepository.findByLivreId(id,
            PageRequest.of(0, 1, Sort.by("dateRetourPrevue")))
        .getContent().stream()
        .filter(e -> e.getDateRetourPrevue() != null)
        .map(e -> e.getDateRetourPrevue().toString())
        .findFirst().orElse(null);

    // File d'attente
    var file = reservationRepository.findByLivreIdAndStatutOrderByPositionAsc(id, StatutReservation.EN_ATTENTE);
    long tailleFile = file.size();

    return Map.of(
        "total", total,
        "disponibles", disponibles,
        "empruntes", empruntes,
        "prochainRetour", prochainRetour != null ? prochainRetour : "",
        "tailleFile", tailleFile
    );
  }
}
