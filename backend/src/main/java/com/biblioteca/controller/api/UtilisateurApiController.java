package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.dto.api.UtilisateurDto;
import com.biblioteca.dto.auth.UpdateProfilRequest;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.UtilisateurService;
import com.biblioteca.util.DtoMapper;
import com.biblioteca.util.FileStorageService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value = "/api/utilisateurs", produces = MediaType.APPLICATION_JSON_VALUE)
public class UtilisateurApiController {

  private final UtilisateurService utilisateurService;
  private final DtoMapper dtoMapper;
  private final UtilisateurRepository utilisateurRepository;
  private final FileStorageService fileStorageService;

  public UtilisateurApiController(UtilisateurService utilisateurService, DtoMapper dtoMapper,
                                   UtilisateurRepository utilisateurRepository,
                                   FileStorageService fileStorageService) {
    this.utilisateurService = utilisateurService;
    this.dtoMapper = dtoMapper;
    this.utilisateurRepository = utilisateurRepository;
    this.fileStorageService = fileStorageService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public PageResponseDto<UtilisateurDto> list(
      @RequestParam(name = "q", required = false) String q,
      @RequestParam(name = "role", required = false) Role role,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size
  ) {
    if (role != null) {
      PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
      return PageResponseDto.from(
          utilisateurService.rechercherParRole(role, pageable).map(dtoMapper::toUtilisateurDto));
    }
    return PageResponseDto.from(utilisateurService.rechercher(q, page, size)
        .map(dtoMapper::toUtilisateurDto));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public UtilisateurDto getById(@PathVariable Long id) {
    return dtoMapper.toUtilisateurDto(utilisateurService.getById(id));
  }

  @PutMapping("/{id}/activer")
  @PreAuthorize("hasRole('ADMIN')")
  public UtilisateurDto activer(@PathVariable Long id, @RequestParam boolean actif) {
    return dtoMapper.toUtilisateurDto(utilisateurService.activer(id, actif));
  }

  @PutMapping("/{id}/role")
  @PreAuthorize("hasRole('ADMIN')")
  public UtilisateurDto modifierRole(@PathVariable Long id, @RequestParam Role role) {
    return dtoMapper.toUtilisateurDto(utilisateurService.modifierRole(id, role));
  }

  @GetMapping("/me")
  public UtilisateurDto getMe(@AuthenticationPrincipal String email) {
    return dtoMapper.toUtilisateurDto(utilisateurService.getByEmail(email));
  }

  @PutMapping("/me")
  public UtilisateurDto updateMe(@AuthenticationPrincipal String email,
                                  @Valid @RequestBody UpdateProfilRequest request) {
    return dtoMapper.toUtilisateurDto(utilisateurService.updateProfil(email, request));
  }

  @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public UtilisateurDto uploadPhoto(@AuthenticationPrincipal String email,
                                    @RequestParam("file") MultipartFile file) {
    try {
      String url = fileStorageService.storeCouverture(file);
      Utilisateur u = utilisateurService.getByEmail(email);
      u.setPhotoUrl(url);
      utilisateurRepository.save(u);
      return dtoMapper.toUtilisateurDto(u);
    } catch (Exception e) {
      throw new BusinessException("Erreur lors de l'upload : " + e.getMessage());
    }
  }

  public record PrefsNotifRequest(
      Boolean notifEmailEmprunt,
      Boolean notifEmailRetour,
      Boolean notifEmailReservation,
      Boolean notifEmailLivreDisponible,
      Boolean notifEmailNouveauLivre,
      Boolean notifEmailRappelRetour
  ) {}

  @GetMapping("/me/notifications")
  public Map<String, Boolean> getPrefsNotif(@AuthenticationPrincipal String email) {
    Utilisateur u = utilisateurService.getByEmail(email);
    return Map.of(
        "notifEmailEmprunt", Boolean.TRUE.equals(u.getNotifEmailEmprunt()),
        "notifEmailRetour", Boolean.TRUE.equals(u.getNotifEmailRetour()),
        "notifEmailReservation", Boolean.TRUE.equals(u.getNotifEmailReservation()),
        "notifEmailLivreDisponible", Boolean.TRUE.equals(u.getNotifEmailLivreDisponible()),
        "notifEmailNouveauLivre", Boolean.TRUE.equals(u.getNotifEmailNouveauLivre()),
        "notifEmailRappelRetour", Boolean.TRUE.equals(u.getNotifEmailRappelRetour())
    );
  }

  @PutMapping("/me/notifications")
  public Map<String, Boolean> updatePrefsNotif(@AuthenticationPrincipal String email,
                                                @RequestBody PrefsNotifRequest req) {
    Utilisateur u = utilisateurService.getByEmail(email);
    if (req.notifEmailEmprunt() != null) u.setNotifEmailEmprunt(req.notifEmailEmprunt());
    if (req.notifEmailRetour() != null) u.setNotifEmailRetour(req.notifEmailRetour());
    if (req.notifEmailReservation() != null) u.setNotifEmailReservation(req.notifEmailReservation());
    if (req.notifEmailLivreDisponible() != null) u.setNotifEmailLivreDisponible(req.notifEmailLivreDisponible());
    if (req.notifEmailNouveauLivre() != null) u.setNotifEmailNouveauLivre(req.notifEmailNouveauLivre());
    if (req.notifEmailRappelRetour() != null) u.setNotifEmailRappelRetour(req.notifEmailRappelRetour());
    utilisateurRepository.save(u);
    return Map.of(
        "notifEmailEmprunt", Boolean.TRUE.equals(u.getNotifEmailEmprunt()),
        "notifEmailRetour", Boolean.TRUE.equals(u.getNotifEmailRetour()),
        "notifEmailReservation", Boolean.TRUE.equals(u.getNotifEmailReservation()),
        "notifEmailLivreDisponible", Boolean.TRUE.equals(u.getNotifEmailLivreDisponible()),
        "notifEmailNouveauLivre", Boolean.TRUE.equals(u.getNotifEmailNouveauLivre()),
        "notifEmailRappelRetour", Boolean.TRUE.equals(u.getNotifEmailRappelRetour())
    );
  }
}
