package com.biblioteca.controller;

import com.biblioteca.entity.Categorie;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CategorieRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/categories")
public class AdminCategorieController {

  public record CategorieForm(
      @NotBlank(message = "Nom obligatoire") @Size(max = 120) String nom,
      String description,
      @Size(max = 20) String couleur
  ) {
  }

  private final CategorieRepository categorieRepository;

  public AdminCategorieController(CategorieRepository categorieRepository) {
    this.categorieRepository = categorieRepository;
  }

  @GetMapping
  public String list(@RequestParam(name = "page", defaultValue = "0") int page,
                     @RequestParam(name = "size", defaultValue = "10") int size,
                     Model model) {
    Page<Categorie> p = categorieRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "nom")));
    model.addAttribute("page", p);
    return "admin/categories/list";
  }

  @GetMapping("/nouveau")
  public String createForm(Model model) {
    model.addAttribute("form", new CategorieForm("", "", "#0d6efd"));
    return "admin/categories/form";
  }

  @PostMapping
  public String create(@Valid @ModelAttribute("form") CategorieForm form,
                       BindingResult bindingResult,
                       RedirectAttributes redirectAttributes) {
    if (bindingResult.hasErrors()) {
      return "admin/categories/form";
    }
    if (categorieRepository.findByNomIgnoreCase(form.nom()).isPresent()) {
      throw new BusinessException("Categorie deja existante");
    }
    Categorie saved = categorieRepository.save(Categorie.builder()
        .nom(form.nom().trim())
        .description(form.description())
        .couleur(form.couleur())
        .build());
    redirectAttributes.addFlashAttribute("success", "Categorie creee");
    return "redirect:/admin/categories/" + saved.getId();
  }

  @GetMapping("/{id}")
  public String detail(@PathVariable Long id, Model model) {
    Categorie cat = categorieRepository.findById(id).orElseThrow(() -> new BusinessException("Categorie introuvable"));
    model.addAttribute("cat", cat);
    model.addAttribute("form", new CategorieForm(cat.getNom(), cat.getDescription(), cat.getCouleur()));
    return "admin/categories/detail";
  }

  @PutMapping("/{id}")
  public String update(@PathVariable Long id,
                       @Valid @ModelAttribute("form") CategorieForm form,
                       BindingResult bindingResult,
                       Model model,
                       RedirectAttributes redirectAttributes) {
    Categorie cat = categorieRepository.findById(id).orElseThrow(() -> new BusinessException("Categorie introuvable"));
    model.addAttribute("cat", cat);
    if (bindingResult.hasErrors()) {
      return "admin/categories/detail";
    }
    categorieRepository.findByNomIgnoreCase(form.nom())
        .filter(existing -> !existing.getId().equals(id))
        .ifPresent(existing -> {
          throw new BusinessException("Nom categorie deja utilise");
        });
    cat.setNom(form.nom().trim());
    cat.setDescription(form.description());
    cat.setCouleur(form.couleur());
    categorieRepository.save(cat);
    redirectAttributes.addFlashAttribute("success", "Categorie modifiee");
    return "redirect:/admin/categories/" + id;
  }
}

