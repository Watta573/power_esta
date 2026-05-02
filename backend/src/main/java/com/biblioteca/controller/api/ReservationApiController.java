package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.dto.api.ReservationDto;
import com.biblioteca.entity.Reservation;
import com.biblioteca.entity.Reservation;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.StatutReservation;
import com.biblioteca.repository.ReservationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.ReservationService;
import com.biblioteca.util.DtoMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/reservations", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReservationApiController {

  private final ReservationRepository reservationRepository;
  private final UtilisateurRepository utilisateurRepository;
  private final ReservationService reservationService;
  private final DtoMapper dtoMapper;

  public ReservationApiController(ReservationRepository reservationRepository,
                                  UtilisateurRepository utilisateurRepository,
                                  ReservationService reservationService,
                                  DtoMapper dtoMapper) {
    this.reservationRepository = reservationRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.reservationService = reservationService;
    this.dtoMapper = dtoMapper;
  }

  public record CreerReservationRequest(Long utilisateurId, Long livreId) {}

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  @Transactional(readOnly = true)
  public PageResponseDto<ReservationDto> list(
      @RequestParam(name = "utilisateurId", required = false) Long utilisateurId,
      @RequestParam(name = "statut", required = false) StatutReservation statut,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size,
      @AuthenticationPrincipal String email
  ) {
    PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    Utilisateur moi = utilisateurRepository.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;

    // Non-staff : force le filtre sur leur propre ID
    Long uid = isStaff ? utilisateurId : moi.getId();

    Page<Reservation> p;
    if (uid != null && statut != null) {
      p = reservationRepository.findByUtilisateurIdAndStatut(uid, statut, pageable);
    } else if (uid != null) {
      p = reservationRepository.findByUtilisateurId(uid, pageable);
    } else if (statut != null) {
      p = reservationRepository.findByStatut(statut, pageable);
    } else {
      p = reservationRepository.findAll(pageable);
    }
    return PageResponseDto.from(p.map(this::toDto));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  @Transactional
  public ReservationDto creer(@RequestBody CreerReservationRequest req) {
    return toDto(reservationService.creerReservation(req.utilisateurId(), req.livreId()));
  }

  @PutMapping("/{id}/confirmer")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  @Transactional
  public ReservationDto confirmer(@PathVariable Long id) {
    return toDto(reservationService.confirmerReservation(id));
  }

  @PutMapping("/{id}/annuler")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  @Transactional
  public void annuler(@PathVariable Long id, @AuthenticationPrincipal String email) {
    Utilisateur moi = utilisateurRepository.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole() == Role.ADMIN || moi.getRole() == Role.BIBLIOTHECAIRE;
    Reservation r = reservationRepository.findById(id)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Réservation introuvable"));
    // Seul le propriétaire peut annuler sa réservation
    if (!isStaff && !r.getUtilisateur().getId().equals(moi.getId())) {
        throw new com.biblioteca.exception.BusinessException("Vous ne pouvez annuler que vos propres réservations");
    }
    // Le staff ne peut annuler que les siennes aussi
    if (isStaff && !r.getUtilisateur().getId().equals(moi.getId())) {
        throw new com.biblioteca.exception.BusinessException("Vous ne pouvez annuler que vos propres réservations");
    }
    reservationService.annuler(id);
  }

  @PostMapping("/{id}/relancer")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  @Transactional
  public ReservationDto relancer(@PathVariable Long id) {
    return toDto(reservationService.relancer(id));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public void supprimer(@PathVariable Long id) {
    reservationService.supprimer(id);
  }

  private ReservationDto toDto(Reservation r) {
    return new ReservationDto(
        r.getId(),
        dtoMapper.toUtilisateurDto(r.getUtilisateur()),
        dtoMapper.toLivreDto(r.getLivre()),
        r.getDateReservation() == null ? null : r.getDateReservation().toString(),
        r.getDateExpiration() == null ? null : r.getDateExpiration().toString(),
        r.getStatut(),
        r.getPosition() == null ? 0 : r.getPosition()
    );
  }
}
