package com.biblioteca.dto.auth;

public record AuthResponse(
    String token,
    String refreshToken,
    UtilisateurAuthResponse utilisateur
) {}
