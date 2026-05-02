package com.biblioteca.controller.api;

import com.biblioteca.dto.ExemplaireCreateRequest;
import com.biblioteca.dto.LivreSaveRequest;
import com.biblioteca.dto.api.ExemplaireDto;
import com.biblioteca.dto.api.LivreDto;
import com.biblioteca.entity.enums.EtatExemplaire;
import com.biblioteca.service.LivreService;
import com.biblioteca.util.DtoMapper;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value = "/api/admin/livres", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
public class AdminLivreApiController {

  private final LivreService livreService;
  private final DtoMapper dtoMapper;

  public AdminLivreApiController(LivreService livreService, DtoMapper dtoMapper) {
    this.livreService = livreService;
    this.dtoMapper = dtoMapper;
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public LivreDto create(
      @Valid @ModelAttribute LivreSaveRequest form,
      @RequestParam(name = "couverture", required = false) MultipartFile couverture
  ) {
    return dtoMapper.toLivreDto(livreService.ajouterLivre(form, couverture));
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public LivreDto update(
      @PathVariable Long id,
      @Valid @ModelAttribute LivreSaveRequest form,
      @RequestParam(name = "couverture", required = false) MultipartFile couverture
  ) {
    return dtoMapper.toLivreDto(livreService.modifierLivre(id, form, couverture));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    livreService.desactiverLivre(id);
  }

  @GetMapping("/{id}/exemplaires")
  public List<ExemplaireDto> getExemplaires(@PathVariable Long id) {
    return livreService.listerExemplaires(id).stream()
        .map(dtoMapper::toExemplaireDto)
        .toList();
  }

  @PostMapping(value = "/{id}/exemplaires", consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public ExemplaireDto addExemplaire(@PathVariable Long id,
                                     @Valid @RequestBody ExemplaireCreateRequest req) {
    return dtoMapper.toExemplaireDto(livreService.ajouterExemplaire(id, req));
  }

  @PutMapping("/{livreId}/exemplaires/{exemplaireId}")
  public ExemplaireDto updateExemplaire(
      @PathVariable Long livreId,
      @PathVariable Long exemplaireId,
      @RequestParam(required = false) EtatExemplaire etat,
      @RequestParam(required = false) Boolean disponible
  ) {
    return dtoMapper.toExemplaireDto(livreService.modifierEtatExemplaire(exemplaireId, etat, disponible));
  }
}
