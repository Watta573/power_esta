package com.biblioteca.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank String ancienMotDePasse,
    @NotBlank @Size(min = 6, max = 255) String nouveauMotDePasse
) {}
