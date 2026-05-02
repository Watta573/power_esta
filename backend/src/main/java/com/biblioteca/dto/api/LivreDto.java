package com.biblioteca.dto.api;

public record LivreDto(
    Long id,
    String titre,
    String auteur,
    String isbn,
    String editeur,
    String edition,
    Integer anneePublication,
    CategorieDto categorie,
    String langue,
    String description,
    String couverture,
    long nombreExemplaires,
    long nombreDisponibles,
    boolean actif
) {}

