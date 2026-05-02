package com.biblioteca.controller;

import com.biblioteca.repository.CategorieRepository;
import com.biblioteca.service.LivreService;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/livres")
public class LivreController {

  private final LivreService livreService;
  private final CategorieRepository categorieRepository;

  public LivreController(LivreService livreService, CategorieRepository categorieRepository) {
    this.livreService = livreService;
    this.categorieRepository = categorieRepository;
  }

  @GetMapping
  public String catalogue(@RequestParam(name = "q", required = false) String q,
                          @RequestParam(name = "categorieId", required = false) Long categorieId,
                          @RequestParam(name = "langue", required = false) String langue,
                          @RequestParam(name = "dispo", required = false) Boolean dispo,
                          @RequestParam(name = "page", defaultValue = "0") int page,
                          @RequestParam(name = "size", defaultValue = "12") int size,
                          Model model) {
    Page<?> p = livreService.rechercherLivres(q, null, null, null, categorieId, langue, null, null, dispo, page, size);
    model.addAttribute("page", p);
    model.addAttribute("q", q);
    model.addAttribute("categorieId", categorieId);
    model.addAttribute("langue", langue);
    model.addAttribute("dispo", dispo);
    model.addAttribute("categories", categorieRepository.findAll());
    return "livres/catalogue";
  }

  @GetMapping("/{id}")
  public String detail(@PathVariable Long id, Model model) {
    var livre = livreService.getLivre(id);
    model.addAttribute("livre", livre);
    model.addAttribute("exemplaires", livreService.listerExemplaires(id));
    model.addAttribute("nbDispo", livreService.obtenirNombreExemplairesDisponibles(id));
    return "livres/detail";
  }
}

