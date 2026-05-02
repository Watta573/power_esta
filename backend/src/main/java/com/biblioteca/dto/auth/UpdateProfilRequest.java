package com.biblioteca.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfilRequest(
    @NotBlank @Size(max = 120) String nom,
    @NotBlank @Size(max = 120) String prenom,
    @Size(max = 30) String telephone
) {}
