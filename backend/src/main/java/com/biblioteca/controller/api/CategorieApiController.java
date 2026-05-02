package com.biblioteca.controller.api;

import com.biblioteca.dto.api.CategorieDto;
import com.biblioteca.service.CategorieService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/categories", produces = MediaType.APPLICATION_JSON_VALUE)
public class CategorieApiController {

  private final CategorieService categorieService;

  public CategorieApiController(CategorieService categorieService) {
    this.categorieService = categorieService;
  }

  public record CategorieRequest(
      @NotBlank @Size(max = 120) String nom,
      String description,
      @Size(max = 20) String couleur
  ) {}

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public List<CategorieDto> list() {
    return categorieService.listerToutes().stream()
        .map(c -> new CategorieDto(c.getId(), c.getNom(), c.getCouleur()))
        .toList();
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public CategorieDto getById(@PathVariable Long id) {
    var c = categorieService.getById(id);
    return new CategorieDto(c.getId(), c.getNom(), c.getCouleur());
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public CategorieDto create(@Valid @RequestBody CategorieRequest req) {
    var c = categorieService.creer(req.nom(), req.description(), req.couleur());
    return new CategorieDto(c.getId(), c.getNom(), c.getCouleur());
  }

  @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public CategorieDto update(@PathVariable Long id, @Valid @RequestBody CategorieRequest req) {
    var c = categorieService.modifier(id, req.nom(), req.description(), req.couleur());
    return new CategorieDto(c.getId(), c.getNom(), c.getCouleur());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('ADMIN')")
  public void delete(@PathVariable Long id) {
    categorieService.supprimer(id);
  }
}
