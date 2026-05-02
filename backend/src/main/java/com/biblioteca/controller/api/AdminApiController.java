package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.AuditLog;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.service.AuditService;
import com.biblioteca.service.UtilisateurService;
import com.biblioteca.util.DtoMapper;
import com.biblioteca.dto.api.UtilisateurDto;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/admin", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
public class AdminApiController {

  private final AuditService auditService;
  private final UtilisateurService utilisateurService;
  private final DtoMapper dtoMapper;

  public AdminApiController(AuditService auditService,
                            UtilisateurService utilisateurService,
                            DtoMapper dtoMapper) {
    this.auditService = auditService;
    this.utilisateurService = utilisateurService;
    this.dtoMapper = dtoMapper;
  }

  @GetMapping("/audit")
  public PageResponseDto<AuditLogDto> getAudit(
      @RequestParam(required = false) String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return PageResponseDto.from(auditService.getAll(q, page, size).map(this::toDto));
  }

  @PutMapping("/utilisateurs/{id}/role")
  public UtilisateurDto changerRole(@PathVariable Long id, @RequestParam Role role) {
    return dtoMapper.toUtilisateurDto(utilisateurService.modifierRole(id, role));
  }

  @PutMapping("/utilisateurs/{id}/activer")
  public UtilisateurDto activer(@PathVariable Long id, @RequestParam boolean actif) {
    return dtoMapper.toUtilisateurDto(utilisateurService.activer(id, actif));
  }

  private AuditLogDto toDto(AuditLog a) {
    return new AuditLogDto(a.getId(), a.getEmail(), a.getRole(), a.getAction(),
        a.getDetails(), a.getIpAddress(),
        a.getDateAction() == null ? null : a.getDateAction().toString(),
        a.getStatut());
  }

  public record AuditLogDto(
      Long id, String email, String role, String action,
      String details, String ipAddress, String dateAction, String statut) {}
}
