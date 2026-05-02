package com.biblioteca.controller.api;

import com.biblioteca.dto.api.EmpruntDto;
import com.biblioteca.dto.api.LivreDto;
import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.Emprunt;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.EmpruntService;
import com.biblioteca.util.DtoMapper;
import com.biblioteca.security.RequirePermission;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/emprunts", produces = MediaType.APPLICATION_JSON_VALUE)
public class EmpruntApiController {

  private final EmpruntRepository empruntRepository;
  private final UtilisateurRepository utilisateurRepository;
  private final EmpruntService empruntService;
  private final DtoMapper dtoMapper;

  public EmpruntApiController(EmpruntRepository empruntRepository,
                              UtilisateurRepository utilisateurRepository,
                              EmpruntService empruntService,
                              DtoMapper dtoMapper) {
    this.empruntRepository = empruntRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.empruntService = empruntService;
    this.dtoMapper = dtoMapper;
  }

  public record CreerEmpruntRequest(Long utilisateurId, Long exemplaireId) {}

  @GetMapping
  @RequirePermission("EMPRUNTS_VIEW")
  @Transactional(readOnly = true)
  public PageResponseDto<EmpruntDto> list(
      @RequestParam(name = "utilisateurId", required = false) Long utilisateurId,
      @RequestParam(name = "livreId", required = false) Long livreId,
      @RequestParam(name = "statut", required = false) StatutEmprunt statut,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size,
      @AuthenticationPrincipal String email
  ) {
    PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    Utilisateur moi = utilisateurRepository.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;

    // Filtre par livre (staff uniquement)
    if (livreId != null && isStaff) {
      return PageResponseDto.from(empruntRepository.findByLivreId(livreId, pageable).map(this::toDto));
    }

    // Non-staff : force le filtre sur leur propre ID
    Long uid = isStaff ? utilisateurId : moi.getId();

    Page<Emprunt> p;
    if (uid != null && statut != null) {
      p = empruntRepository.findByUtilisateurIdAndStatut(uid, statut, pageable);
    } else if (uid != null) {
      p = empruntRepository.findByUtilisateurId(uid, pageable);
    } else if (statut != null) {
      p = empruntRepository.findByStatut(statut, pageable);
    } else {
      p = empruntRepository.findAll(pageable);
    }
    return PageResponseDto.from(p.map(this::toDto));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @RequirePermission("EMPRUNTS_CREATE")
  @Transactional
  public EmpruntDto creer(@RequestBody CreerEmpruntRequest req) {
    return toDto(empruntService.creerEmprunt(req.utilisateurId(), req.exemplaireId()));
  }

  @PutMapping("/{id}/retour")
  @Transactional
  public EmpruntDto retour(@PathVariable Long id, @AuthenticationPrincipal String email) {
    Utilisateur moi = utilisateurRepository.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    if (!isStaff) {
      Emprunt emprunt = empruntRepository.findById(id)
          .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Emprunt introuvable"));
      if (!emprunt.getUtilisateur().getId().equals(moi.getId())) {
        throw new org.springframework.security.access.AccessDeniedException("Accès refusé");
      }
    }
    return toDto(empruntService.enregistrerRetour(id));
  }

  @PutMapping("/{id}/renouveler")
  @RequirePermission("EMPRUNTS_EXTEND")
  @Transactional
  public EmpruntDto renouveler(@PathVariable Long id) {
    return toDto(empruntService.renouvelerEmprunt(id));
  }

  @PutMapping("/{id}/payer-amende")
  @RequirePermission("FINANCES_AMENDES_COLLECT")
  @Transactional
  public EmpruntDto payerAmende(@PathVariable Long id) {
    return toDto(empruntService.payerAmende(id));
  }

  private EmpruntDto toDto(Emprunt e) {
    long joursRetard = 0;
    if (e.getDateRetourEffective() == null && e.getDateRetourPrevue() != null) {
      joursRetard = Math.max(0, LocalDate.now().toEpochDay() - e.getDateRetourPrevue().toEpochDay());
    }
    LivreDto livreDto = null;
    if (e.getExemplaire() != null && e.getExemplaire().getLivre() != null) {
      livreDto = dtoMapper.toLivreDto(e.getExemplaire().getLivre());
    }
    return new EmpruntDto(
        e.getId(),
        dtoMapper.toUtilisateurDto(e.getUtilisateur()),
        dtoMapper.toExemplaireDto(e.getExemplaire()),
        livreDto,
        e.getDateEmprunt() == null ? null : e.getDateEmprunt().toString(),
        e.getDateRetourPrevue() == null ? null : e.getDateRetourPrevue().toString(),
        e.getDateRetourEffective() == null ? null : e.getDateRetourEffective().toString(),
        e.getStatut(),
        e.getNombreRenouvellements() == null ? 0 : e.getNombreRenouvellements(),
        e.getAmende() == null ? 0 : e.getAmende().doubleValue(),
        joursRetard
    );
  }
}
