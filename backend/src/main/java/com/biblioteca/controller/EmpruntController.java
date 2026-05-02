package com.biblioteca.controller;

import com.biblioteca.service.EmpruntService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping
public class EmpruntController {
  private final EmpruntService empruntService;

  public EmpruntController(EmpruntService empruntService) {
    this.empruntService = empruntService;
  }

  @GetMapping("/emprunts")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String list(Model model) {
    model.addAttribute("emprunts", empruntService.getEmpruntsEnRetard());
    return "emprunts/list";
  }

  @PostMapping("/emprunts/nouveau")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String create(@RequestParam Long utilisateurId,
                       @RequestParam Long exemplaireId,
                       RedirectAttributes ra) {
    empruntService.creerEmprunt(utilisateurId, exemplaireId);
    ra.addFlashAttribute("success", "Emprunt cree");
    return "redirect:/emprunts";
  }

  @PutMapping("/emprunts/{id}/retour")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String retour(@PathVariable Long id, RedirectAttributes ra) {
    empruntService.enregistrerRetour(id);
    ra.addFlashAttribute("success", "Retour enregistre");
    return "redirect:/emprunts";
  }

  @PutMapping("/emprunts/{id}/renouveler")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String renouveler(@PathVariable Long id, RedirectAttributes ra) {
    empruntService.renouvelerEmprunt(id);
    ra.addFlashAttribute("success", "Emprunt renouvelle");
    return "redirect:/emprunts";
  }

  @GetMapping("/emprunts/en-retard")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public String retards(Model model) {
    model.addAttribute("emprunts", empruntService.getEmpruntsEnRetard());
    return "emprunts/retards";
  }
}

