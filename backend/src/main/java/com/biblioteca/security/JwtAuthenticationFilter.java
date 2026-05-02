package com.biblioteca.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();
    // Exclure du filtre JWT uniquement les endpoints publics d'auth
    if (!path.startsWith("/api/")) return true;
    if (path.equals("/api/auth/login")) return true;
    if (path.equals("/api/auth/register")) return true;
    if (path.equals("/api/auth/forgot-password")) return true;
    if (path.equals("/api/auth/reset-password")) return true;
    // /api/auth/change-password nécessite un token JWT valide
    return false;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authHeader.substring(7);
    Optional<Claims> claimsOpt = jwtService.parseToken(token);
    if (claimsOpt.isEmpty()) {
      filterChain.doFilter(request, response);
      return;
    }

    Claims claims = claimsOpt.get();
    String email = claims.getSubject();
    String role = claims.get("role", String.class);
    if (email != null && role != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      var authority = new SimpleGrantedAuthority("ROLE_" + role);
      var authentication = new UsernamePasswordAuthenticationToken(email, null, List.of(authority));
      authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    filterChain.doFilter(request, response);
  }
}
