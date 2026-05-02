package com.biblioteca.service;

import com.biblioteca.dto.auth.ChangePasswordRequest;
import com.biblioteca.dto.auth.RegisterRequest;
import com.biblioteca.dto.auth.UpdateProfilRequest;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UtilisateurService {
  Utilisateur inscrire(RegisterRequest request);

  Utilisateur getById(Long id);

  Utilisateur getByEmail(String email);

  Page<Utilisateur> rechercher(String q, int page, int size);

  Page<Utilisateur> rechercherParRole(Role role, Pageable pageable);

  Utilisateur activer(Long id, boolean actif);

  Utilisateur modifierRole(Long id, Role role);

  void changerMotDePasse(String email, ChangePasswordRequest request);

  Utilisateur updateProfil(String email, UpdateProfilRequest request);
}
