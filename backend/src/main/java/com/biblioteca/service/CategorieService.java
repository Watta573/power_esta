package com.biblioteca.service;

import com.biblioteca.entity.Categorie;
import java.util.List;

public interface CategorieService {
  List<Categorie> listerToutes();

  Categorie getById(Long id);

  Categorie creer(String nom, String description, String couleur);

  Categorie modifier(Long id, String nom, String description, String couleur);

  void supprimer(Long id);
}
