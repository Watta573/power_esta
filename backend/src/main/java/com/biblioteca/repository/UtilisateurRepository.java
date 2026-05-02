package com.biblioteca.repository;

import com.biblioteca.entity.Utilisateur;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
  Optional<Utilisateur> findByEmail(String email);
  Optional<Utilisateur> findByIdentifiant(String identifiant);
  boolean existsByEmail(String email);
  boolean existsByIdentifiant(String identifiant);

  Page<Utilisateur> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCaseOrEmailContainingIgnoreCaseOrIdentifiantContainingIgnoreCase(
      String nom, String prenom, String email, String identifiant, Pageable pageable);

  Page<Utilisateur> findByRole(com.biblioteca.entity.enums.Role role, Pageable pageable);

  Optional<Utilisateur> findByRefreshToken(String refreshToken);
  Optional<Utilisateur> findByTokenVerification(String token);
  java.util.List<Utilisateur> findByNotifEmailNouveauLivreTrue();
}

