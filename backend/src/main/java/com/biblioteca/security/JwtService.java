package com.biblioteca.security;

import com.biblioteca.entity.Utilisateur;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey key;
  private final String issuer;
  private final long expirationMinutes;
  private final long refreshExpirationDays;

  public JwtService(
      @Value("${app.security.jwt.secret}") String secret,
      @Value("${app.security.jwt.issuer}") String issuer,
      @Value("${app.security.jwt.expiration-minutes}") long expirationMinutes,
      @Value("${app.security.jwt.refresh-expiration-days:7}") long refreshExpirationDays
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.issuer = issuer;
    this.expirationMinutes = expirationMinutes;
    this.refreshExpirationDays = refreshExpirationDays;
  }

  public String generateToken(Utilisateur utilisateur) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(utilisateur.getEmail())
        .issuer(issuer)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
        .claim("uid", utilisateur.getId())
        .claim("role", utilisateur.getRole().name())
        .claim("identifiant", utilisateur.getIdentifiant())
        .signWith(key)
        .compact();
  }

  public String generateRefreshToken(Utilisateur utilisateur) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(utilisateur.getEmail())
        .issuer(issuer)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(refreshExpirationDays, ChronoUnit.DAYS)))
        .claim("type", "refresh")
        .signWith(key)
        .compact();
  }

  public String extractUsername(String token) {
    return parseToken(token).map(Claims::getSubject).orElse(null);
  }

  public Optional<Claims> parseToken(String token) {
    try {
      Claims claims = Jwts.parser()
          .verifyWith(key)
          .requireIssuer(issuer)
          .build()
          .parseSignedClaims(token)
          .getPayload();
      return Optional.of(claims);
    } catch (JwtException | IllegalArgumentException ex) {
      return Optional.empty();
    }
  }
}
