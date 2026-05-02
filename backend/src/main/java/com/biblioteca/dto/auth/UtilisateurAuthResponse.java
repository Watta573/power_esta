package com.biblioteca.dto.auth;

import com.biblioteca.entity.enums.Role;

public record UtilisateurAuthResponse(
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
    int nombreEmpruntsEnCours,
    int nombreRetards
) {}
