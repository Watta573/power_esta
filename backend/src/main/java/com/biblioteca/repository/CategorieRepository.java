package com.biblioteca.repository;

import com.biblioteca.entity.Categorie;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategorieRepository extends JpaRepository<Categorie, Long> {
  Optional<Categorie> findByNomIgnoreCase(String nom);
}

