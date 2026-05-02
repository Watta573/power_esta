package com.biblioteca.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record LivreSaveRequest(
    @NotBlank(message = "Titre obligatoire")
    @Size(max = 255)
    String titre,
    @NotBlank(message = "ISBN obligatoire")
    @Size(max = 20)
    String isbn,
    @NotBlank(message = "Auteur obligatoire")
    @Size(max = 180)
    String auteur,
    @Size(max = 180)
    String editeur,
    @Size(max = 50)
    String edition,
    Integer anneePublication,
    @NotNull(message = "Categorie obligatoire")
    Long categorieId,
    List<Long> langueIds,
    String description,
    Integer nombrePages,
    Integer nombreExemplaires
) {
  // Compatibilité rétrograde
  public String langue() { return null; }
}

