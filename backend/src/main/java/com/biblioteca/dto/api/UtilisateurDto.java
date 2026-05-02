package com.biblioteca.dto.api;

import com.biblioteca.entity.enums.Role;

public record UtilisateurDto(
    Long id,
    String nom,
    String prenom,
    String identifiant,
    String email,
    String telephone,
    Role role,
    boolean actif,
    String dateInscription,
    String photo,
    long nombreEmpruntsEnCours,
    long nombreRetards
) {}

