package com.biblioteca.controller.api;

import com.biblioteca.entity.Langue;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.LangueRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/langues", produces = MediaType.APPLICATION_JSON_VALUE)
public class LangueApiController {

  private final LangueRepository langueRepository;

  public LangueApiController(LangueRepository langueRepository) {
    this.langueRepository = langueRepository;
  }

  public record LangueRequest(@NotBlank @Size(max = 80) String nom) {}
  public record LangueDto(Long id, String nom) {}

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public List<LangueDto> list() {
    return langueRepository.findAll().stream()
        .map(l -> new LangueDto(l.getId(), l.getNom()))
        .toList();
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public LangueDto create(@Valid @RequestBody LangueRequest req) {
    if (langueRepository.existsByNomIgnoreCase(req.nom())) {
      throw new BusinessException("Cette langue existe déjà");
    }
    Langue saved = langueRepository.save(Langue.builder().nom(req.nom()).build());
    return new LangueDto(saved.getId(), saved.getNom());
  }

  @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public LangueDto update(@PathVariable Long id, @Valid @RequestBody LangueRequest req) {
    Langue l = langueRepository.findById(id)
        .orElseThrow(() -> new BusinessException("Langue introuvable"));
    if (!l.getNom().equalsIgnoreCase(req.nom()) && langueRepository.existsByNomIgnoreCase(req.nom())) {
      throw new BusinessException("Cette langue existe déjà");
    }
    l.setNom(req.nom());
    Langue saved = langueRepository.save(l);
    return new LangueDto(saved.getId(), saved.getNom());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public void delete(@PathVariable Long id) {
    langueRepository.findById(id)
        .orElseThrow(() -> new BusinessException("Langue introuvable"));
    langueRepository.deleteById(id);
  }
}
