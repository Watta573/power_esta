package com.biblioteca.repository;

import com.biblioteca.entity.WishlistItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
  List<WishlistItem> findByUtilisateurIdOrderByDateAjoutDesc(Long utilisateurId);
  Optional<WishlistItem> findByUtilisateurIdAndLivreId(Long utilisateurId, Long livreId);
  boolean existsByUtilisateurIdAndLivreId(Long utilisateurId, Long livreId);
  void deleteByUtilisateurIdAndLivreId(Long utilisateurId, Long livreId);
}
