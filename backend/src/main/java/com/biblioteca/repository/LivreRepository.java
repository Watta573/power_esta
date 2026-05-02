package com.biblioteca.repository;

import com.biblioteca.entity.Livre;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LivreRepository extends JpaRepository<Livre, Long>, JpaSpecificationExecutor<Livre> {
  Optional<Livre> findByIsbn(String isbn);

  boolean existsByIsbn(String isbn);

  boolean existsByCategorieId(Long categorieId);

  List<Livre> findTop10ByTitreContainingIgnoreCaseOrderByTitreAsc(String titre);

  List<Livre> findTop10ByAuteurContainingIgnoreCaseOrderByAuteurAsc(String auteur);

  @Query("select l.categorie.nom, count(l) from Livre l group by l.categorie.nom order by count(l) desc")
  List<Object[]> countByCategorieGroupByNom();

  // Méthode pour la répartition par catégories
  @Query("SELECT c.nom, COUNT(l) FROM Livre l JOIN l.categorie c GROUP BY c.nom ORDER BY COUNT(l) DESC")
  List<Object[]> countLivresByCategorie();


}

