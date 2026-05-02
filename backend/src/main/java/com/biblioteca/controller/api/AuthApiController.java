package com.biblioteca.controller.api;

import com.biblioteca.dto.auth.AuthResponse;
import com.biblioteca.dto.auth.ChangePasswordRequest;
import com.biblioteca.dto.auth.ForgotPasswordRequest;
import com.biblioteca.dto.auth.LoginRequest;
import com.biblioteca.dto.auth.RegisterRequest;
import com.biblioteca.dto.auth.UtilisateurAuthResponse;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.security.JwtService;
import com.biblioteca.service.AuditService;
import com.biblioteca.service.EmailService;
import com.biblioteca.service.UtilisateurService;
import com.biblioteca.util.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

  private static final int MAX_ATTEMPTS = 5;
  private static final int LOCK_MINUTES = 15;

  private final UtilisateurService utilisateurService;
  private final UtilisateurRepository utilisateurRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuditService auditService;
  private final EmailService emailService;

  @Value("${app.frontend.url:http://localhost:5173}")
  private String frontendUrl;

  public AuthApiController(UtilisateurService utilisateurService,
                           UtilisateurRepository utilisateurRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuditService auditService,
                           EmailService emailService) {
    this.utilisateurService = utilisateurService;
    this.utilisateurRepository = utilisateurRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.auditService = auditService;
    this.emailService = emailService;
  }

  // ── Inscription ──────────────────────────────────────────────────────────────
  @PostMapping("/register")
  public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    try {
      Utilisateur saved = utilisateurService.inscrire(request);
      String token = UUID.randomUUID().toString();
      saved.setTokenVerification(token);
      utilisateurRepository.save(saved);
      try {
        emailService.sendVerificationEmail(saved.getEmail(), saved.getPrenom(), frontendUrl + "/verify-email?token=" + token);
      } catch (Exception e) {
        System.err.println("Erreur envoi email vérification: " + e.getMessage());
      }
      String refreshToken = jwtService.generateRefreshToken(saved);
      saved.setRefreshToken(refreshToken);
      saved.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
      utilisateurRepository.save(saved);
      return ResponseEntity.status(HttpStatus.CREATED)
          .body(new AuthResponse(jwtService.generateToken(saved), refreshToken, toAuthUser(saved)));
    } catch (BusinessException ex) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }
  }

  // ── Connexion avec limitation des tentatives ──────────────────────────────────
  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
    String ip = IpUtils.getClientIp(httpRequest);
    Utilisateur utilisateur = utilisateurRepository.findByEmail(request.email()).orElse(null);

    if (utilisateur == null) {
      auditService.log(null, request.email(), "INCONNU", "CONNEXION", "Email inconnu", ip, "FAILURE");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Identifiants invalides"));
    }

    // Vérifier si le compte est verrouillé
    if (utilisateur.getLockedUntil() != null && utilisateur.getLockedUntil().isAfter(LocalDateTime.now())) {
      long minutesLeft = java.time.Duration.between(LocalDateTime.now(), utilisateur.getLockedUntil()).toMinutes() + 1;
      auditService.log(utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
          "CONNEXION", "Compte verrouillé", ip, "FAILURE");
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
          .body(Map.of("message", "Compte temporairement verrouillé. Réessayez dans " + minutesLeft + " minute(s)."));
    }

    if (!Boolean.TRUE.equals(utilisateur.getActif())
        || !passwordEncoder.matches(request.motDePasse(), utilisateur.getPassword())) {
      int attempts = (utilisateur.getLoginAttempts() == null ? 0 : utilisateur.getLoginAttempts()) + 1;
      utilisateur.setLoginAttempts(attempts);
      if (attempts >= MAX_ATTEMPTS) {
        utilisateur.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        utilisateur.setLoginAttempts(0);
        utilisateurRepository.save(utilisateur);
        auditService.log(utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
            "CONNEXION", "Compte verrouillé après " + MAX_ATTEMPTS + " tentatives", ip, "FAILURE");
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(Map.of("message", "Trop de tentatives. Compte verrouillé " + LOCK_MINUTES + " minutes."));
      }
      utilisateurRepository.save(utilisateur);
      auditService.log(utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
          "CONNEXION", "Échec tentative " + attempts + "/" + MAX_ATTEMPTS, ip, "FAILURE");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("message", "Identifiants invalides", "attemptsLeft", MAX_ATTEMPTS - attempts));
    }

    // Réinitialiser les tentatives après succès
    utilisateur.setLoginAttempts(0);
    utilisateur.setLockedUntil(null);

    // Vérifier 2FA si activé
    if (Boolean.TRUE.equals(utilisateur.getTotpActif())) {
      if (request.totpCode() == null || request.totpCode().isBlank()) {
        utilisateurRepository.save(utilisateur);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
            .body(Map.of("requires2fa", true, "message", "Code 2FA requis"));
      }
      if (!TotpUtil.verify(utilisateur.getTotpSecret(), request.totpCode())) {
        auditService.log(utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
            "CONNEXION", "Code 2FA invalide", ip, "FAILURE");
        utilisateurRepository.save(utilisateur);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Code 2FA invalide"));
      }
    }

    String refreshToken = jwtService.generateRefreshToken(utilisateur);
    utilisateur.setRefreshToken(refreshToken);
    utilisateur.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
    utilisateurRepository.save(utilisateur);

    auditService.log(utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name(),
        "CONNEXION", "Connexion réussie", ip, "SUCCESS");
    return ResponseEntity.ok(new AuthResponse(jwtService.generateToken(utilisateur), refreshToken, toAuthUser(utilisateur)));
  }

  // ── Refresh token ─────────────────────────────────────────────────────────────
  @PostMapping("/refresh")
  public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
    String refreshToken = body.get("refreshToken");
    if (refreshToken == null || refreshToken.isBlank()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Refresh token manquant"));
    }
    Utilisateur utilisateur = utilisateurRepository.findByRefreshToken(refreshToken).orElse(null);
    if (utilisateur == null
        || utilisateur.getRefreshTokenExpiry() == null
        || utilisateur.getRefreshTokenExpiry().isBefore(LocalDateTime.now())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Refresh token invalide ou expiré"));
    }
    String newRefresh = jwtService.generateRefreshToken(utilisateur);
    utilisateur.setRefreshToken(newRefresh);
    utilisateur.setRefreshTokenExpiry(LocalDateTime.now().plusDays(7));
    utilisateurRepository.save(utilisateur);
    return ResponseEntity.ok(new AuthResponse(jwtService.generateToken(utilisateur), newRefresh, toAuthUser(utilisateur)));
  }

  // ── Vérification email ────────────────────────────────────────────────────────
  @GetMapping("/verify-email")
  public ResponseEntity<?> verifyEmail(@RequestParam String token) {
    Utilisateur utilisateur = utilisateurRepository.findByTokenVerification(token).orElse(null);
    if (utilisateur == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Token de vérification invalide"));
    }
    utilisateur.setEmailVerifie(true);
    utilisateur.setTokenVerification(null);
    utilisateurRepository.save(utilisateur);
    return ResponseEntity.ok(Map.of("message", "Email vérifié avec succès"));
  }

  @PostMapping("/resend-verification")
  public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
    String email = body.get("email");
    Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElse(null);
    if (utilisateur != null && !Boolean.TRUE.equals(utilisateur.getEmailVerifie())) {
      String token = UUID.randomUUID().toString();
      utilisateur.setTokenVerification(token);
      utilisateurRepository.save(utilisateur);
      try {
        emailService.sendVerificationEmail(email, utilisateur.getPrenom(), frontendUrl + "/verify-email?token=" + token);
      } catch (Exception e) {
        System.err.println("Erreur renvoi email: " + e.getMessage());
      }
    }
    return ResponseEntity.ok(Map.of("message", "Si ce compte existe et n'est pas vérifié, un email a été envoyé"));
  }

  // ── 2FA TOTP ──────────────────────────────────────────────────────────────────
  @PostMapping("/2fa/setup")
  public ResponseEntity<?> setup2fa(@AuthenticationPrincipal String email) {
    Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseThrow();
    String secret = TotpUtil.generateSecret();
    utilisateur.setTotpSecret(secret);
    utilisateurRepository.save(utilisateur);
    String otpAuthUrl = TotpUtil.getOtpAuthUrl(secret, utilisateur.getEmail(), "BibliothequeESTA");
    return ResponseEntity.ok(Map.of("secret", secret, "otpAuthUrl", otpAuthUrl));
  }

  @PostMapping("/2fa/activate")
  public ResponseEntity<?> activate2fa(@AuthenticationPrincipal String email,
                                        @RequestBody Map<String, String> body) {
    Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseThrow();
    String code = body.get("code");
    if (!TotpUtil.verify(utilisateur.getTotpSecret(), code)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Code invalide"));
    }
    utilisateur.setTotpActif(true);
    utilisateurRepository.save(utilisateur);
    return ResponseEntity.ok(Map.of("message", "2FA activé avec succès"));
  }

  @PostMapping("/2fa/disable")
  public ResponseEntity<?> disable2fa(@AuthenticationPrincipal String email,
                                       @RequestBody Map<String, String> body) {
    Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseThrow();
    if (!passwordEncoder.matches(body.get("motDePasse"), utilisateur.getPassword())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Mot de passe incorrect"));
    }
    utilisateur.setTotpActif(false);
    utilisateur.setTotpSecret(null);
    utilisateurRepository.save(utilisateur);
    return ResponseEntity.ok(Map.of("message", "2FA désactivé"));
  }

  // ── Mot de passe oublié ───────────────────────────────────────────────────────
  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return ResponseEntity.ok(Map.of(
        "message", "Si ce compte existe, un email de réinitialisation a été envoyé",
        "email", request.email()
    ));
  }

  @PostMapping("/change-password")
  public ResponseEntity<?> changePassword(
      @AuthenticationPrincipal String email,
      @Valid @RequestBody ChangePasswordRequest request,
      HttpServletRequest httpRequest) {
    try {
      Utilisateur u = utilisateurRepository.findByEmail(email).orElseThrow();
      utilisateurService.changerMotDePasse(email, request);
      auditService.log(u.getId(), email, u.getRole().name(),
          "CHANGEMENT_MOT_DE_PASSE", "Mot de passe modifié", IpUtils.getClientIp(httpRequest), "SUCCESS");
      return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
    } catch (BusinessException ex) {
      auditService.log(null, email, "INCONNU",
          "CHANGEMENT_MOT_DE_PASSE", ex.getMessage(), IpUtils.getClientIp(httpRequest), "FAILURE");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
    }
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────────
  @PostMapping("/logout")
  public ResponseEntity<?> logout(@AuthenticationPrincipal String email) {
    utilisateurRepository.findByEmail(email).ifPresent(u -> {
      u.setRefreshToken(null);
      u.setRefreshTokenExpiry(null);
      utilisateurRepository.save(u);
    });
    return ResponseEntity.ok(Map.of("message", "Déconnecté avec succès"));
  }

  private UtilisateurAuthResponse toAuthUser(Utilisateur u) {
    return new UtilisateurAuthResponse(
        u.getId(), u.getNom(), u.getPrenom(), u.getIdentifiant(), u.getEmail(),
        u.getTelephone(), u.getRole(), Boolean.TRUE.equals(u.getActif()),
        u.getDateInscription() == null ? null : u.getDateInscription().toString(),
        null, 0, 0
    );
  }
}
