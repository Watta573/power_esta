package com.biblioteca.dto;

public record LivreSearchItemResponse(
    Long id,
    String titre,
    String isbn,
    String auteur,
    String categorie,
    String langue,
    Integer anneePublication,
    String couverture,
    long nbDisponibles
) {
}

