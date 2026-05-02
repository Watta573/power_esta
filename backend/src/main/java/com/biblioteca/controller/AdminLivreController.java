package com.biblioteca.controller;

import com.biblioteca.dto.ExemplaireCreateRequest;
import com.biblioteca.dto.LivreSaveRequest;
import com.biblioteca.entity.enums.EtatExemplaire;
import com.biblioteca.repository.CategorieRepository;
import com.biblioteca.service.LivreService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/livres")
public class AdminLivreController {

  private final LivreService livreService;
  private final CategorieRepository categorieRepository;

  public AdminLivreController(LivreService livreService, CategorieRepository categorieRepository) {
    this.livreService = livreService;
    this.categorieRepository = categorieRepository;
  }

  @GetMapping
  public String list(@RequestParam(name = "q", required = false) String q,
                     @RequestParam(name = "categorieId", required = false) Long categorieId,
                     @RequestParam(name = "page", defaultValue = "0") int page,
                     @RequestParam(name = "size", defaultValue = "10") int size,
                     Model model) {
    Page<?> p = livreService.rechercherLivres(q, null, null, null, categorieId, null, null, null, null, page, size);
    model.addAttribute("page", p);
    model.addAttribute("q", q);
    model.addAttribute("categorieId", categorieId);
    model.addAttribute("categories", categorieRepository.findAll());
    return "admin/livres/list";
  }

  @GetMapping("/nouveau")
  public String createForm(Model model) {
    model.addAttribute("form", new LivreSaveRequest("", "", "", "", "", null, null, null, "", null, null));
    model.addAttribute("categories", categorieRepository.findAll());
    return "admin/livres/form";
  }

  @PostMapping
  public String create(@Valid @ModelAttribute("form") LivreSaveRequest form,
                       BindingResult bindingResult,
                       @RequestParam(name = "couverture", required = false) MultipartFile couverture,
                       Model model,
                       RedirectAttributes redirectAttributes) {
    model.addAttribute("categories", categorieRepository.findAll());
    if (bindingResult.hasErrors()) {
      return "admin/livres/form";
    }
    var created = livreService.ajouterLivre(form, couverture);
    redirectAttributes.addFlashAttribute("success", "Livre cree");
    return "redirect:/admin/livres/" + created.getId();
  }

  @GetMapping("/{id}")
  public String detail(@PathVariable Long id, Model model) {
    var livre = livreService.getLivre(id);
    model.addAttribute("livre", livre);
    model.addAttribute("categories", categorieRepository.findAll());
    model.addAttribute("form", new LivreSaveRequest(
        livre.getTitre(),
        livre.getIsbn(),
        livre.getAuteur(),
        livre.getEditeur(),
        livre.getEdition(),
        livre.getAnneePublication(),
        livre.getCategorie().getId(),
        livre.getLangues() != null ? livre.getLangues().stream().map(l -> l.getId()).toList() : null,
        livre.getDescription(),
        livre.getNombrePages(),
        null
    ));
    model.addAttribute("exemplaires", livreService.listerExemplaires(id));
    model.addAttribute("etatValues", EtatExemplaire.values());
    model.addAttribute("exemplaireForm", new ExemplaireCreateRequest("", EtatExemplaire.BON, true, ""));
    return "admin/livres/detail";
  }

  @GetMapping("/{id}/historique")
  public String historique(@PathVariable Long id, Model model) {
    var livre = livreService.getLivre(id);
    model.addAttribute("livre", livre);
    model.addAttribute("mouvements", livreService.getHistoriqueMouvements(id, null, null));
    return "admin/livres/historique";
  }

  @PutMapping("/{id}")
  public String update(@PathVariable Long id,
                       @Valid @ModelAttribute("form") LivreSaveRequest form,
                       BindingResult bindingResult,
                       @RequestParam(name = "couverture", required = false) MultipartFile couverture,
                       Model model,
                       RedirectAttributes redirectAttributes) {
    var livre = livreService.getLivre(id);
    model.addAttribute("livre", livre);
    model.addAttribute("categories", categorieRepository.findAll());
    model.addAttribute("exemplaires", livreService.listerExemplaires(id));
    model.addAttribute("etatValues", EtatExemplaire.values());
    model.addAttribute("exemplaireForm", new ExemplaireCreateRequest("", EtatExemplaire.BON, true, ""));

    if (bindingResult.hasErrors()) {
      return "admin/livres/detail";
    }
    livreService.modifierLivre(id, form, couverture);
    redirectAttributes.addFlashAttribute("success", "Livre modifie");
    return "redirect:/admin/livres/" + id;
  }

  @PostMapping("/{id}/exemplaires")
  public String addExemplaire(@PathVariable Long id,
                              @Valid @ModelAttribute("exemplaireForm") ExemplaireCreateRequest exemplaireForm,
                              BindingResult bindingResult,
                              Model model,
                              RedirectAttributes redirectAttributes) {
    if (bindingResult.hasErrors()) {
      return detail(id, model);
    }
    livreService.ajouterExemplaire(id, exemplaireForm);
    redirectAttributes.addFlashAttribute("success", "Exemplaire ajoute");
    return "redirect:/admin/livres/" + id;
  }
}

