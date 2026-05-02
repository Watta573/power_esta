package com.biblioteca.dto.api;

import com.biblioteca.entity.enums.StatutReservation;

public record ReservationDto(
    Long id,
    UtilisateurDto utilisateur,
    LivreDto livre,
    String dateReservation,
    String dateExpiration,
    StatutReservation statut,
    int position
) {}

