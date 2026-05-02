package com.biblioteca.controller;

import java.security.Principal;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthPageController {

  @GetMapping("/login")
  public String login() {
    return "login";
  }

  @GetMapping({"/", "/accueil"})
  public String accueil(Authentication authentication) {
    if (authentication == null) {
      return "redirect:/login";
    }
    boolean adminLike = authentication.getAuthorities().stream()
        .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_BIBLIOTHECAIRE".equals(a.getAuthority()));
    return adminLike ? "redirect:/dashboard" : "redirect:/livres";
  }

  @GetMapping("/profil")
  public String profil(Principal principal, Authentication authentication, Model model) {
    model.addAttribute("username", principal == null ? "" : principal.getName());
    model.addAttribute("roles", authentication == null ? ""
        : authentication.getAuthorities().stream().map(a -> a.getAuthority().replace("ROLE_", "")).collect(Collectors.joining(", ")));
    return "profil";
  }
}

