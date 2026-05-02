package com.biblioteca.controller.api;

import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.WishlistItem;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.repository.WishlistItemRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/wishlist", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("isAuthenticated()")
public class WishlistApiController {

  private final WishlistItemRepository wishlistRepo;
  private final LivreRepository livreRepo;
  private final UtilisateurRepository utilisateurRepo;

  public WishlistApiController(WishlistItemRepository wishlistRepo,
                                LivreRepository livreRepo,
                                UtilisateurRepository utilisateurRepo) {
    this.wishlistRepo = wishlistRepo;
    this.livreRepo = livreRepo;
    this.utilisateurRepo = utilisateurRepo;
  }

  @GetMapping
  public List<WishlistItem> getMaWishlist(@RequestParam Long utilisateurId) {
    return wishlistRepo.findByUtilisateurIdOrderByDateAjoutDesc(utilisateurId);
  }

  @GetMapping("/check")
  public Map<String, Boolean> check(@RequestParam Long utilisateurId, @RequestParam Long livreId) {
    return Map.of("inWishlist", wishlistRepo.existsByUtilisateurIdAndLivreId(utilisateurId, livreId));
  }

  @PostMapping("/{livreId}")
  @Transactional
  public Map<String, Object> ajouter(@PathVariable Long livreId, @RequestParam Long utilisateurId) {
    if (wishlistRepo.existsByUtilisateurIdAndLivreId(utilisateurId, livreId))
      return Map.of("status", "already_exists", "inWishlist", true);

    Utilisateur u = utilisateurRepo.findById(utilisateurId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Utilisateur introuvable"));
    Livre l = livreRepo.findById(livreId)
        .orElseThrow(() -> new com.biblioteca.exception.BusinessException("Livre introuvable"));

    wishlistRepo.save(WishlistItem.builder().utilisateur(u).livre(l).build());
    return Map.of("status", "added", "inWishlist", true);
  }

  @DeleteMapping("/{livreId}")
  @Transactional
  public Map<String, Object> retirer(@PathVariable Long livreId, @RequestParam Long utilisateurId) {
    wishlistRepo.deleteByUtilisateurIdAndLivreId(utilisateurId, livreId);
    return Map.of("status", "removed", "inWishlist", false);
  }
}
