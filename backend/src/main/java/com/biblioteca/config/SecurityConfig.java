package com.biblioteca.config;

import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.security.CinetPayWebhookFilter;
import com.biblioteca.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final UtilisateurRepository utilisateurRepository;
  private final CinetPayWebhookFilter cinetPayWebhookFilter;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                        UtilisateurRepository utilisateurRepository,
                        CinetPayWebhookFilter cinetPayWebhookFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.utilisateurRepository = utilisateurRepository;
    this.cinetPayWebhookFilter = cinetPayWebhookFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(unauthorizedEntryPoint())
        )
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/cinetpay/notify").permitAll()
            .requestMatchers("/uploads/**").permitAll()
            .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/statistiques/public", "/api/statistiques/public-v2").permitAll()
            .requestMatchers("/api/**").authenticated()
            .anyRequest().permitAll()
        )
        .addFilterBefore(cinetPayWebhookFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "tauri://localhost"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setExposedHeaders(Arrays.asList("Authorization"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }

  @Bean
  public AuthenticationEntryPoint unauthorizedEntryPoint() {
    return (request, response, authException) -> {
      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      response.setContentType("application/json");
      response.getWriter().write("{\"message\":\"Non authentifié\",\"status\":401}");
    };
  }

  @Bean
  public UserDetailsService userDetailsService() {
    return email -> utilisateurRepository.findByEmail(email)
        .map(u -> User.withUsername(u.getEmail())
            .password(u.getPassword())
            .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())))
            .accountLocked(!Boolean.TRUE.equals(u.getActif()))
            .build())
        .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable: " + email));
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}

