package com.biblioteca.service.impl;

import com.biblioteca.dto.auth.ChangePasswordRequest;
import com.biblioteca.dto.auth.RegisterRequest;
import com.biblioteca.dto.auth.UpdateProfilRequest;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.EmailService;
import com.biblioteca.service.NotificationService;
import com.biblioteca.service.UtilisateurService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UtilisateurServiceImpl implements UtilisateurService {

  private final UtilisateurRepository utilisateurRepository;
  private final PasswordEncoder passwordEncoder;
  private final NotificationService notificationService;
  private final EmailService emailService;

  public UtilisateurServiceImpl(UtilisateurRepository utilisateurRepository,
                                PasswordEncoder passwordEncoder,
                                NotificationService notificationService,
                                EmailService emailService) {
    this.utilisateurRepository = utilisateurRepository;
    this.passwordEncoder = passwordEncoder;
    this.notificationService = notificationService;
    this.emailService = emailService;
  }

  @Override
  @Transactional
  public Utilisateur inscrire(RegisterRequest request) {
    if (utilisateurRepository.existsByEmail(request.email())) {
      throw new BusinessException("Cet email est déjà utilisé");
    }
    if (utilisateurRepository.existsByIdentifiant(request.identifiant())) {
      throw new BusinessException("Cet identifiant est déjà utilisé");
    }
    Utilisateur u = Utilisateur.builder()
        .nom(request.nom())
        .prenom(request.prenom())
        .identifiant(request.identifiant())
        .email(request.email())
        .telephone(request.telephone())
        .role(request.role())
        .password(passwordEncoder.encode(request.motDePasse()))
        .actif(true)
        .build();
    Utilisateur saved = utilisateurRepository.save(u);

    // Envoi email de bienvenue (EmailService)
    try {
      System.out.println("Envoi email de bienvenue à: " + saved.getEmail());
      emailService.sendWelcomeEmail(
          saved.getEmail(),
          saved.getPrenom() + " " + saved.getNom()
      );
      System.out.println("Email de bienvenue envoyé avec succès");
    } catch (Exception e) {
      System.err.println("Erreur email bienvenue: " + e.getMessage());
      e.printStackTrace();
    }

    // Notification interne
    notificationService.envoyerEmailBienvenue(saved);
    return saved;
  }

  @Override
  @Transactional(readOnly = true)
  public Utilisateur getById(Long id) {
    return utilisateurRepository.findById(id)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Utilisateur> rechercher(String q, int page, int size) {
    PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    if (q == null || q.isBlank()) {
      return utilisateurRepository.findAll(pageable);
    }
    return utilisateurRepository
        .findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCaseOrEmailContainingIgnoreCaseOrIdentifiantContainingIgnoreCase(
            q, q, q, q, pageable);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Utilisateur> rechercherParRole(Role role, Pageable pageable) {
    return utilisateurRepository.findByRole(role, pageable);
  }

  @Override
  @Transactional
  public Utilisateur activer(Long id, boolean actif) {
    Utilisateur u = getById(id);
    u.setActif(actif);
    return utilisateurRepository.save(u);
  }

  @Override
  @Transactional
  public Utilisateur modifierRole(Long id, Role role) {
    Utilisateur u = getById(id);
    u.setRole(role);
    return utilisateurRepository.save(u);
  }

  @Override
  @Transactional(readOnly = true)
  public Utilisateur getByEmail(String email) {
    return utilisateurRepository.findByEmail(email)
        .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));
  }

  @Override
  @Transactional
  public void changerMotDePasse(String email, ChangePasswordRequest request) {
    Utilisateur u = getByEmail(email);
    if (!passwordEncoder.matches(request.ancienMotDePasse(), u.getPassword())) {
      throw new BusinessException("Mot de passe actuel incorrect");
    }
    u.setPassword(passwordEncoder.encode(request.nouveauMotDePasse()));
    utilisateurRepository.save(u);
  }

  @Override
  @Transactional
  public Utilisateur updateProfil(String email, UpdateProfilRequest request) {
    Utilisateur u = getByEmail(email);
    u.setNom(request.nom());
    u.setPrenom(request.prenom());
    u.setTelephone(request.telephone());
    return utilisateurRepository.save(u);
  }
}
