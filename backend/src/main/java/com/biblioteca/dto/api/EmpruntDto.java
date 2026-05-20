package com.biblioteca.dto.api;

import com.biblioteca.entity.enums.StatutEmprunt;

public record EmpruntDto(
    Long id,
    UtilisateurDto utilisateur,
    ExemplaireDto exemplaire,
    LivreDto livre,
    String dateEmprunt,
    String dateRetourPrevue,
    String dateRetourEffective,
    StatutEmprunt statut,
    int nombreRenouvellements,
    double amende,
    long joursRetard,
    boolean amendePayee
) {}

