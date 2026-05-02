package com.biblioteca.controller;

import com.biblioteca.entity.enums.EtatExemplaire;
import com.biblioteca.service.LivreService;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/exemplaires")
public class AdminExemplaireController {

  private final LivreService livreService;

  public AdminExemplaireController(LivreService livreService) {
    this.livreService = livreService;
  }

  @PutMapping("/{id}")
  public String update(@PathVariable Long id,
                       @RequestParam(name = "etat", required = false) EtatExemplaire etat,
                       @RequestParam(name = "disponible", required = false) Boolean disponible,
                       @RequestParam(name = "livreId") @NotNull Long livreId,
                       RedirectAttributes redirectAttributes) {
    livreService.modifierEtatExemplaire(id, etat, disponible);
    redirectAttributes.addFlashAttribute("success", "Exemplaire modifie");
    return "redirect:/admin/livres/" + livreId;
  }
}

