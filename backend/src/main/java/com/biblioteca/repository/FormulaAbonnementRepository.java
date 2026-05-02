package com.biblioteca.repository;

import com.biblioteca.entity.FormulaAbonnement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FormulaAbonnementRepository extends JpaRepository<FormulaAbonnement, Long> {
    List<FormulaAbonnement> findByActifTrueOrderByOrdreAsc();
}
