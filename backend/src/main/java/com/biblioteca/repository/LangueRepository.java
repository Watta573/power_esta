package com.biblioteca.repository;

import com.biblioteca.entity.Langue;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LangueRepository extends JpaRepository<Langue, Long> {
  Optional<Langue> findByNomIgnoreCase(String nom);
  boolean existsByNomIgnoreCase(String nom);
}
