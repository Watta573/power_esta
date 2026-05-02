package com.biblioteca.dto.auth;

import com.biblioteca.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(max = 120) String nom,
    @NotBlank @Size(max = 120) String prenom,
    @NotBlank @Size(max = 32) String identifiant,
    @NotBlank @Email @Size(max = 180) String email,
    @NotBlank @Size(min = 6, max = 255) String motDePasse,
    @Size(max = 30) String telephone,
    @NotNull Role role
) {}
