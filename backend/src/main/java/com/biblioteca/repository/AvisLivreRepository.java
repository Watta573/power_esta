package com.biblioteca.repository;

import com.biblioteca.entity.AvisLivre;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvisLivreRepository extends JpaRepository<AvisLivre, Long> {
  Page<AvisLivre> findByLivreIdOrderByDateAvisDesc(Long livreId, Pageable pageable);
  Optional<AvisLivre> findByUtilisateurIdAndLivreId(Long utilisateurId, Long livreId);
  boolean existsByUtilisateurIdAndLivreId(Long utilisateurId, Long livreId);

  @Query("select coalesce(avg(a.note), 0) from AvisLivre a where a.livre.id = :livreId")
  double avgNoteByLivreId(@Param("livreId") Long livreId);

  @Query("select count(a) from AvisLivre a where a.livre.id = :livreId")
  long countByLivreId(@Param("livreId") Long livreId);

  // Pour l'admin : tous les avis paginés
  Page<AvisLivre> findAllByOrderByDateAvisDesc(Pageable pageable);
}
