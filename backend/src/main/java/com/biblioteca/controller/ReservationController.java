package com.biblioteca.controller;

import com.biblioteca.service.ReservationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping
public class ReservationController {
  private final ReservationService reservationService;

  public ReservationController(ReservationService reservationService) {
    this.reservationService = reservationService;
  }

  @PostMapping("/reservations")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public String create(@RequestParam Long utilisateurId,
                       @RequestParam Long livreId,
                       RedirectAttributes ra) {
    reservationService.creerReservation(utilisateurId, livreId);
    ra.addFlashAttribute("success", "Reservation creee");
    return "redirect:/mes-reservations?utilisateurId=" + utilisateurId;
  }

  @GetMapping("/mes-reservations")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public String mesReservations(@RequestParam Long utilisateurId, Model model) {
    model.addAttribute("reservations", reservationService.getReservationsUtilisateur(utilisateurId));
    return "reservations/mes-reservations";
  }

  @DeleteMapping("/reservations/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE','ETUDIANT','ENSEIGNANT','PUBLIC')")
  public String annuler(@PathVariable Long id,
                        @RequestParam Long utilisateurId,
                        RedirectAttributes ra) {
    reservationService.annuler(id);
    ra.addFlashAttribute("success", "Reservation annulee");
    return "redirect:/mes-reservations?utilisateurId=" + utilisateurId;
  }

  @GetMapping("/admin/reservations")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String all(Model model) {
    model.addAttribute("reservations", reservationService.getToutesReservations());
    return "reservations/admin-list";
  }

  @PutMapping("/admin/reservations/{id}/confirmer")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String confirmer(@PathVariable Long id, RedirectAttributes ra) {
    reservationService.confirmerReservation(id);
    ra.addFlashAttribute("success", "Reservation confirmee");
    return "redirect:/admin/reservations";
  }
}

