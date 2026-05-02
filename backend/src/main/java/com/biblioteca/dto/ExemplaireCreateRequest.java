package com.biblioteca.dto;

import com.biblioteca.entity.enums.EtatExemplaire;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExemplaireCreateRequest(
    @NotBlank(message = "Code exemplaire obligatoire")
    @Size(max = 40)
    String codeExemplaire,
    @NotNull(message = "Etat obligatoire")
    EtatExemplaire etat,
    Boolean disponible,
    @Size(max = 120)
    String localisation
) {
}

