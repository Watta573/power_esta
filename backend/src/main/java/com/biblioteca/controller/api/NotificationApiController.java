package com.biblioteca.controller.api;

import com.biblioteca.dto.api.NotificationDto;
import com.biblioteca.entity.DiffusionGroupee;
import com.biblioteca.service.NotificationService;
import com.biblioteca.util.DtoMapper;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
public class NotificationApiController {

  private final NotificationService notificationService;
  private final DtoMapper dtoMapper;

  public NotificationApiController(NotificationService notificationService, DtoMapper dtoMapper) {
    this.notificationService = notificationService;
    this.dtoMapper = dtoMapper;
  }

  @GetMapping
  public Page<NotificationDto> list(
      @RequestParam Long utilisateurId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return notificationService
        .listerUtilisateurPage(utilisateurId, PageRequest.of(page, size))
        .map(dtoMapper::toNotificationDto);
  }

  @GetMapping("/count")
  public Map<String, Long> count(@RequestParam Long utilisateurId) {
    return Map.of("count", notificationService.countNonLues(utilisateurId));
  }

  @PutMapping("/{id}/lire")
  public Map<String, String> lire(@PathVariable Long id) {
    notificationService.marquerCommeLu(id);
    return Map.of("status", "ok");
  }

  @PutMapping("/lire-tout")
  public Map<String, String> lireTout(@RequestParam Long utilisateurId) {
    notificationService.marquerToutCommeLu(utilisateurId);
    return Map.of("status", "ok");
  }

  public record DiffusionRequest(
      List<String> roles,
      String sujet,
      String message,
      String type,
      String dateEnvoiProgramme,
      Long expediteurId
  ) {}

  @PostMapping("/envoyer-groupee")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public Map<String, Object> envoyerGroupee(@RequestBody DiffusionRequest req) {
    notificationService.envoyerGroupee(
        req.roles(),
        req.sujet() != null ? req.sujet() : "Message de la Biblioth\u00e8que ESTA",
        req.message(),
        req.type(),
        req.dateEnvoiProgramme(),
        req.expediteurId()
    );
    boolean planifie = req.dateEnvoiProgramme() != null && !req.dateEnvoiProgramme().isBlank();
    return Map.of("status", "ok", "planifie", planifie);
  }

  @GetMapping("/historique-diffusions")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public Page<Map<String, Object>> historiqueDiffusions(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return notificationService.getHistoriqueDiffusions(PageRequest.of(page, size))
        .map(d -> {
          var exp = d.getExpediteur();
          return Map.<String, Object>of(
              "id", d.getId(),
              "sujet", d.getSujet(),
              "message", d.getMessage(),
              "type", d.getType(),
              "rolesCibles", d.getRolesCibles(),
              "nbDestinataires", d.getNbDestinataires(),
              "dateEnvoi", d.getDateEnvoi() != null ? d.getDateEnvoi().toString() : "",
              "statut", d.getStatut(),
              "expediteur", exp != null ? Map.of(
                  "id", exp.getId(),
                  "nom", exp.getNom(),
                  "prenom", exp.getPrenom()
              ) : Map.of()
          );
        });
  }
}
