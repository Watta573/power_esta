package com.biblioteca.repository;

import com.biblioteca.entity.AlerteThematique;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlerteThematiqueRepository extends JpaRepository<AlerteThematique, Long> {
  List<AlerteThematique> findByUtilisateurId(Long utilisateurId);
  boolean existsByUtilisateurIdAndTypeAlerteAndValeur(Long utilisateurId, String typeAlerte, String valeur);
  void deleteByUtilisateurIdAndId(Long utilisateurId, Long id);
  List<AlerteThematique> findByTypeAlerteAndValeur(String typeAlerte, String valeur);
}
