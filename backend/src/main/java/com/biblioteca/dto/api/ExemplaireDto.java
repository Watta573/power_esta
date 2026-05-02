package com.biblioteca.dto.api;

import com.biblioteca.entity.enums.EtatExemplaire;

public record ExemplaireDto(
    Long id,
    String codeExemplaire,
    EtatExemplaire etat,
    boolean disponible,
    String localisation
) {}

