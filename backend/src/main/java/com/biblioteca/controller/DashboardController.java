package com.biblioteca.controller;

import com.biblioteca.service.StatistiqueService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {
  private final StatistiqueService statistiqueService;

  public DashboardController(StatistiqueService statistiqueService) {
    this.statistiqueService = statistiqueService;
  }

  @GetMapping("/dashboard")
  public String dashboard(Model model) {
    model.addAttribute("totalLivres", statistiqueService.getNombreLivresTotal());
    model.addAttribute("empruntsEnCours", statistiqueService.getNombreEmpruntsEnCours());
    model.addAttribute("retards", statistiqueService.getNombreRetards());
    Map<LocalDate, Long> empruntsParJour = statistiqueService.getEmpruntsParJour(LocalDate.now().minusDays(29), LocalDate.now());
    Map<String, Long> repartition = statistiqueService.getRepartitionParCategorie();

    List<String> jours = new ArrayList<>();
    List<Long> valeursJours = new ArrayList<>();
    empruntsParJour.forEach((k, v) -> {
      jours.add(k.toString());
      valeursJours.add(v);
    });

    List<String> categories = new ArrayList<>();
    List<Long> valeursCategories = new ArrayList<>();
    repartition.forEach((k, v) -> {
      categories.add(k);
      valeursCategories.add(v);
    });

    model.addAttribute("joursLabels", jours);
    model.addAttribute("joursValues", valeursJours);
    model.addAttribute("catLabels", categories);
    model.addAttribute("catValues", valeursCategories);
    return "dashboard";
  }
}

