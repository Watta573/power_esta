package com.biblioteca.controller.api;

import com.biblioteca.dto.api.PageResponseDto;
import com.biblioteca.entity.*;
import com.biblioteca.entity.enums.StatutNumeroPeriodique;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.*;
import com.biblioteca.service.NotificationService;
import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.TypeNotification;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/periodiques-ext", produces = MediaType.APPLICATION_JSON_VALUE)
public class PeriodiqueExtApiController {

  private final AbonnementPeriodiqueRepository abonnementRepo;
  private final EmpruntPeriodiqueRepository empruntRepo;
  private final ReservationPeriodiqueRepository reservationRepo;
  private final NumeroPeriodiqueRepository numeroRepo;
  private final FournisseurRepository fournisseurRepo;
  private final UtilisateurRepository utilisateurRepo;
  private final NotificationService notificationService;

  private static final BigDecimal TARIF_JOURNALIER = BigDecimal.valueOf(100);

  public PeriodiqueExtApiController(
      AbonnementPeriodiqueRepository abonnementRepo,
      EmpruntPeriodiqueRepository empruntRepo,
      ReservationPeriodiqueRepository reservationRepo,
      NumeroPeriodiqueRepository numeroRepo,
      FournisseurRepository fournisseurRepo,
      UtilisateurRepository utilisateurRepo,
      NotificationService notificationService) {
    this.abonnementRepo = abonnementRepo;
    this.empruntRepo = empruntRepo;
    this.reservationRepo = reservationRepo;
    this.numeroRepo = numeroRepo;
    this.fournisseurRepo = fournisseurRepo;
    this.utilisateurRepo = utilisateurRepo;
    this.notificationService = notificationService;
  }

  // ─── DTOs ────────────────────────────────────────────────────────────────

  public record AbonnementDto(Long id, Long periodiqueId, String titrePeriodique,
      Long fournisseurId, String nomFournisseur, String dateDebut, String dateFin,
      double montant, String statut, String notes) {}

  public record EmpruntPeriodiqueDto(Long id, Long numeroId, String titrePeriodique,
      String volume, String numero, Long utilisateurId, String nomUtilisateur,
      String emailUtilisateur, String role, String dateEmprunt, String dateRetourPrevue,
      String dateRetourEffective, String statut, double amende, boolean amendePayee,
      long joursRetard) {}

  public record ReservationPeriodiqueDto(Long id, Long numeroId, String titrePeriodique,
      String volume, String numero, Long utilisateurId, String nomUtilisateur,
      String emailUtilisateur, String dateReservation, String dateExpiration, String statut) {}

  public record AbonnementRequest(@NotNull Long periodiqueId, @NotNull Long fournisseurId,
      @NotNull String dateDebut, @NotNull String dateFin, double montant, String notes) {}

  public record EmpruntRequest(@NotNull Long numeroId, @NotNull Long utilisateurId) {}

  public record ReservationRequest(@NotNull Long numeroId, @NotNull Long utilisateurId) {}

  // ═══════════════════════════════════════════════════════════════════════
  // ABONNEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  @GetMapping("/abonnements")
  @Transactional(readOnly = true)
  public PageResponseDto<AbonnementDto> listAbonnements(
      @RequestParam(required = false) String statut,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    var pageable = PageRequest.of(page, size, Sort.by("dateDebut").descending());
    Page<AbonnementPeriodique> result = statut != null
        ? abonnementRepo.findByStatut(statut, pageable)
        : abonnementRepo.findAll(pageable);
    return PageResponseDto.from(result.map(this::toAbonnementDto));
  }

  @PostMapping("/abonnements")
  @Transactional
  public ResponseEntity<AbonnementDto> creerAbonnement(@Valid @RequestBody AbonnementRequest req) {
    NumeroPeriodique numero = numeroRepo.findById(req.periodiqueId())
        .orElseThrow(() -> new BusinessException("Périodique introuvable"));
    Fournisseur fournisseur = fournisseurRepo.findById(req.fournisseurId())
        .orElseThrow(() -> new BusinessException("Fournisseur introuvable"));
    AbonnementPeriodique a = AbonnementPeriodique.builder()
        .periodique(numero.getPeriodique())
        .fournisseur(fournisseur)
        .dateDebut(LocalDate.parse(req.dateDebut()))
        .dateFin(LocalDate.parse(req.dateFin()))
        .montant(BigDecimal.valueOf(req.montant()))
        .notes(req.notes())
        .build();
    return ResponseEntity.status(HttpStatus.CREATED).body(toAbonnementDto(abonnementRepo.save(a)));
  }

  @PutMapping("/abonnements/{id}/annuler")
  @Transactional
  public AbonnementDto annulerAbonnement(@PathVariable Long id) {
    AbonnementPeriodique a = abonnementRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Abonnement introuvable"));
    a.setStatut("ANNULE");
    return toAbonnementDto(abonnementRepo.save(a));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EMPRUNTS DE NUMÉROS
  // ═══════════════════════════════════════════════════════════════════════

  @GetMapping("/emprunts")
  @Transactional(readOnly = true)
  public PageResponseDto<EmpruntPeriodiqueDto> listEmprunts(
      @RequestParam(required = false) Long utilisateurId,
      @RequestParam(required = false) String statut,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal String email) {
    var pageable = PageRequest.of(page, size);
    Utilisateur moi = utilisateurRepo.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole().name().equals("ADMIN") || moi.getRole().name().equals("BIBLIOTHECAIRE");
    Long uid = isStaff ? utilisateurId : moi.getId();
    return PageResponseDto.from(empruntRepo.findFiltered(uid, statut, pageable).map(this::toEmpruntDto));
  }

  @PostMapping("/emprunts")
  @Transactional
  public ResponseEntity<EmpruntPeriodiqueDto> creerEmprunt(@Valid @RequestBody EmpruntRequest req) {
    NumeroPeriodique numero = numeroRepo.findById(req.numeroId())
        .orElseThrow(() -> new BusinessException("Numéro introuvable"));
    if (!Boolean.TRUE.equals(numero.getDisponible()))
      throw new BusinessException("Ce numéro n'est pas disponible");
    Utilisateur user = utilisateurRepo.findById(req.utilisateurId())
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    if (empruntRepo.existsByUtilisateurIdAndStatut(user.getId(), "EN_RETARD"))
      throw new BusinessException("Utilisateur bloqué : retard existant sur un périodique");

    int duree = switch (user.getRole()) {
      case ENSEIGNANT -> 7;
      case ETUDIANT -> 3;
      default -> 3;
    };

    EmpruntPeriodique e = EmpruntPeriodique.builder()
        .numero(numero).utilisateur(user)
        .dateEmprunt(LocalDate.now())
        .dateRetourPrevue(LocalDate.now().plusDays(duree))
        .statut("EN_COURS")
        .build();
    numero.setDisponible(false);
    numeroRepo.save(numero);
    EmpruntPeriodique saved = empruntRepo.save(e);
    notificationService.notifier(user, TypeNotification.EMPRUNT_CREE,
        "Emprunt périodique : " + numero.getPeriodique().getTitre() + " N°" + numero.getNumero()
        + " — retour prévu le " + saved.getDateRetourPrevue(), CanalNotification.INTERNE);
    return ResponseEntity.status(HttpStatus.CREATED).body(toEmpruntDto(saved));
  }

  @PutMapping("/emprunts/{id}/retour")
  @Transactional
  public EmpruntPeriodiqueDto retour(@PathVariable Long id) {
    EmpruntPeriodique e = empruntRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Emprunt introuvable"));
    e.setDateRetourEffective(LocalDate.now());
    long jours = ChronoUnit.DAYS.between(e.getDateRetourPrevue(), LocalDate.now());
    if (jours > 0) e.setAmende(TARIF_JOURNALIER.multiply(BigDecimal.valueOf(jours)));
    e.setStatut("RETOURNE");
    e.getNumero().setDisponible(true);
    numeroRepo.save(e.getNumero());
    EmpruntPeriodique saved = empruntRepo.save(e);
    notificationService.notifier(e.getUtilisateur(), TypeNotification.RETOUR_CONFIRME,
        "Retour périodique confirmé : " + e.getNumero().getPeriodique().getTitre(), CanalNotification.INTERNE);
    if (e.getAmende().compareTo(BigDecimal.ZERO) > 0) {
      notificationService.notifier(e.getUtilisateur(), TypeNotification.AMENDE_GENEREE,
          "Amende périodique : " + e.getAmende() + " FCFA", CanalNotification.INTERNE);
    }
    // Notifier le prochain en file d'attente
    reservationRepo.findByNumeroIdAndStatutOrderByDateReservationAsc(e.getNumero().getId(), "EN_ATTENTE")
        .stream().findFirst().ifPresent(r -> {
          r.setStatut("DISPONIBLE");
          reservationRepo.save(r);
          notificationService.notifier(r.getUtilisateur(), TypeNotification.LIVRE_DISPONIBLE,
              "Le numéro " + e.getNumero().getPeriodique().getTitre() + " N°" + e.getNumero().getNumero()
              + " que vous avez réservé est maintenant disponible.", CanalNotification.INTERNE);
        });
    return toEmpruntDto(saved);
  }

  @PutMapping("/emprunts/{id}/payer-amende")
  @Transactional
  public EmpruntPeriodiqueDto payerAmende(@PathVariable Long id) {
    EmpruntPeriodique e = empruntRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Emprunt introuvable"));
    e.setAmendePayee(true);
    EmpruntPeriodique saved = empruntRepo.save(e);
    notificationService.notifier(e.getUtilisateur(), TypeNotification.AMENDE_GENEREE,
        "Amende périodique de " + e.getAmende() + " FCFA réglée. Merci !", CanalNotification.INTERNE);
    return toEmpruntDto(saved);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RÉSERVATIONS DE NUMÉROS
  // ═══════════════════════════════════════════════════════════════════════

  @GetMapping("/reservations")
  @Transactional(readOnly = true)
  public PageResponseDto<ReservationPeriodiqueDto> listReservations(
      @RequestParam(required = false) Long utilisateurId,
      @RequestParam(required = false) String statut,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal String email) {
    var pageable = PageRequest.of(page, size);
    Utilisateur moi = utilisateurRepo.findByEmail(email).orElseThrow();
    boolean isStaff = moi.getRole().name().equals("ADMIN") || moi.getRole().name().equals("BIBLIOTHECAIRE");
    Long uid = isStaff ? utilisateurId : moi.getId();
    Page<ReservationPeriodique> result;
    if (uid != null && statut != null)
      result = reservationRepo.findByUtilisateurIdAndStatut(uid, statut, pageable);
    else if (uid != null)
      result = reservationRepo.findByUtilisateurId(uid, pageable);
    else if (statut != null)
      result = reservationRepo.findByStatut(statut, pageable);
    else
      result = reservationRepo.findAll(pageable);
    return PageResponseDto.from(result.map(this::toReservationDto));
  }

  @PostMapping("/reservations")
  @Transactional
  public ResponseEntity<ReservationPeriodiqueDto> creerReservation(@Valid @RequestBody ReservationRequest req) {
    NumeroPeriodique numero = numeroRepo.findById(req.numeroId())
        .orElseThrow(() -> new BusinessException("Numéro introuvable"));
    Utilisateur user = utilisateurRepo.findById(req.utilisateurId())
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
    if (reservationRepo.existsByNumeroIdAndUtilisateurIdAndStatutIn(
        req.numeroId(), req.utilisateurId(), java.util.List.of("EN_ATTENTE", "DISPONIBLE")))
      throw new BusinessException("Vous avez déjà une réservation active pour ce numéro");
    ReservationPeriodique r = ReservationPeriodique.builder()
        .numero(numero).utilisateur(user).build();
    ReservationPeriodique saved = reservationRepo.save(r);
    notificationService.notifier(user, TypeNotification.RESERVATION_CREEE,
        "Réservation périodique : " + numero.getPeriodique().getTitre() + " N°" + numero.getNumero(),
        CanalNotification.INTERNE);
    return ResponseEntity.status(HttpStatus.CREATED).body(toReservationDto(saved));
  }

  @PutMapping("/reservations/{id}/annuler")
  @Transactional
  public ReservationPeriodiqueDto annulerReservation(@PathVariable Long id) {
    ReservationPeriodique r = reservationRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Réservation introuvable"));
    r.setStatut("ANNULEE");
    return toReservationDto(reservationRepo.save(r));
  }

  @PutMapping("/reservations/{id}/confirmer")
  @Transactional
  public ReservationPeriodiqueDto confirmerReservation(@PathVariable Long id) {
    ReservationPeriodique r = reservationRepo.findById(id)
        .orElseThrow(() -> new BusinessException("Réservation introuvable"));
    r.setStatut("CONFIRMEE");
    return toReservationDto(reservationRepo.save(r));
  }

  // ─── Scheduler retards ───────────────────────────────────────────────

  @Scheduled(cron = "0 5 8 * * *")
  @Transactional
  public void detecterRetardsPeriodiques() {
    LocalDate today = LocalDate.now();
    empruntRepo.findByDateRetourPrevueBeforeAndStatut(today, "EN_COURS").forEach(e -> {
      e.setStatut("EN_RETARD");
      long jours = ChronoUnit.DAYS.between(e.getDateRetourPrevue(), today);
      e.setAmende(TARIF_JOURNALIER.multiply(BigDecimal.valueOf(jours)));
      empruntRepo.save(e);
      notificationService.notifier(e.getUtilisateur(), TypeNotification.RETARD_CONSTATE,
          "Retard périodique : " + e.getNumero().getPeriodique().getTitre()
          + " N°" + e.getNumero().getNumero() + " — " + jours + " jour(s) de retard",
          CanalNotification.INTERNE);
    });
    // Expirer les abonnements
    abonnementRepo.findByStatutAndDateFinBefore("ACTIF", today).forEach(a -> {
      a.setStatut("EXPIRE");
      abonnementRepo.save(a);
    });
    // Vérifier les numéros attendus qui n'ont toujours pas été reçus
    numeroRepo.findByStatutAndDateParutionBefore(StatutNumeroPeriodique.ATTENDU, today)
        .forEach(numero -> {
          long joursRetard = ChronoUnit.DAYS.between(numero.getDateParution(), today);
          if (joursRetard > 30) {
            numero.setStatut(StatutNumeroPeriodique.MANQUANT);
          } else {
            numero.setStatut(StatutNumeroPeriodique.EN_RETARD);
          }
          numeroRepo.save(numero);
          notificationService.envoyerGroupee(
              java.util.List.of("BIBLIOTHECAIRE"),
              "Numéro périodique en retard ou manquant",
              "Le numéro " + numero.getPeriodique().getTitre() + " N°" + numero.getNumero()
                  + " attendu le " + numero.getDateParution()
                  + " n'est toujours pas reçu. Statut mis à jour : " + numero.getStatut(),
              "PERIODIQUE", null, null);
        });
    // Expirer les réservations
    reservationRepo.findByDateExpirationBeforeAndStatutIn(today,
        java.util.List.of("EN_ATTENTE", "DISPONIBLE")).forEach(r -> {
      r.setStatut("ANNULEE");
      reservationRepo.save(r);
    });
  }

  // ─── Mappers ─────────────────────────────────────────────────────────

  private AbonnementDto toAbonnementDto(AbonnementPeriodique a) {
    return new AbonnementDto(a.getId(),
        a.getPeriodique().getId(), a.getPeriodique().getTitre(),
        a.getFournisseur().getId(), a.getFournisseur().getNom(),
        a.getDateDebut().toString(), a.getDateFin().toString(),
        a.getMontant().doubleValue(), a.getStatut(), a.getNotes());
  }

  private EmpruntPeriodiqueDto toEmpruntDto(EmpruntPeriodique e) {
    long joursRetard = 0;
    if (e.getDateRetourEffective() == null && e.getDateRetourPrevue() != null)
      joursRetard = Math.max(0, ChronoUnit.DAYS.between(e.getDateRetourPrevue(), LocalDate.now()));
    return new EmpruntPeriodiqueDto(e.getId(),
        e.getNumero().getId(),
        e.getNumero().getPeriodique().getTitre(),
        e.getNumero().getVolume(), e.getNumero().getNumero(),
        e.getUtilisateur().getId(),
        e.getUtilisateur().getPrenom() + " " + e.getUtilisateur().getNom(),
        e.getUtilisateur().getEmail(),
        e.getUtilisateur().getRole().name(),
        e.getDateEmprunt().toString(),
        e.getDateRetourPrevue().toString(),
        e.getDateRetourEffective() != null ? e.getDateRetourEffective().toString() : null,
        e.getStatut(),
        e.getAmende().doubleValue(),
        Boolean.TRUE.equals(e.getAmendePayee()),
        joursRetard);
  }

  private ReservationPeriodiqueDto toReservationDto(ReservationPeriodique r) {
    return new ReservationPeriodiqueDto(r.getId(),
        r.getNumero().getId(),
        r.getNumero().getPeriodique().getTitre(),
        r.getNumero().getVolume(), r.getNumero().getNumero(),
        r.getUtilisateur().getId(),
        r.getUtilisateur().getPrenom() + " " + r.getUtilisateur().getNom(),
        r.getUtilisateur().getEmail(),
        r.getDateReservation().toString(),
        r.getDateExpiration().toString(),
        r.getStatut());
  }
}
