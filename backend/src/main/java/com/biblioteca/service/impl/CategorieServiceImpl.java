package com.biblioteca.service.impl;

import com.biblioteca.entity.Categorie;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CategorieRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.service.CategorieService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategorieServiceImpl implements CategorieService {

  private final CategorieRepository categorieRepository;
  private final LivreRepository livreRepository;

  public CategorieServiceImpl(CategorieRepository categorieRepository,
                              LivreRepository livreRepository) {
    this.categorieRepository = categorieRepository;
    this.livreRepository = livreRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Categorie> listerToutes() {
    return categorieRepository.findAll();
  }

  @Override
  @Transactional(readOnly = true)
  public Categorie getById(Long id) {
    return categorieRepository.findById(id)
        .orElseThrow(() -> new BusinessException("Catégorie introuvable"));
  }

  @Override
  @Transactional
  public Categorie creer(String nom, String description, String couleur) {
    if (categorieRepository.findByNomIgnoreCase(nom).isPresent()) {
      throw new BusinessException("Une catégorie avec ce nom existe déjà");
    }
    return categorieRepository.save(Categorie.builder()
        .nom(nom)
        .description(description)
        .couleur(couleur)
        .build());
  }

  @Override
  @Transactional
  public Categorie modifier(Long id, String nom, String description, String couleur) {
    Categorie c = getById(id);
    if (!c.getNom().equalsIgnoreCase(nom) && categorieRepository.findByNomIgnoreCase(nom).isPresent()) {
      throw new BusinessException("Une catégorie avec ce nom existe déjà");
    }
    c.setNom(nom);
    c.setDescription(description);
    c.setCouleur(couleur);
    return categorieRepository.save(c);
  }

  @Override
  @Transactional
  public void supprimer(Long id) {
    Categorie c = getById(id);
    if (livreRepository.existsByCategorieId(id)) {
      throw new BusinessException("Impossible de supprimer: des livres utilisent cette catégorie");
    }
    categorieRepository.delete(c);
  }
}
