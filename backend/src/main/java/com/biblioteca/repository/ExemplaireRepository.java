package com.biblioteca.repository;

import com.biblioteca.entity.Exemplaire;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExemplaireRepository extends JpaRepository<Exemplaire, Long> {
  List<Exemplaire> findByLivreIdOrderByIdAsc(Long livreId);

  Optional<Exemplaire> findFirstByLivreIdAndDisponibleTrueAndBloquePourReservationFalseOrderByIdAsc(Long livreId);

  Optional<Exemplaire> findFirstByLivreIdAndBloquePourReservationTrueOrderByIdAsc(Long livreId);

  long countByLivreIdAndDisponibleTrueAndBloquePourReservationFalse(Long livreId);

  long countByLivreIdAndBloquePourReservationTrue(Long livreId);

  long countByLivreId(Long livreId);

  long countByDisponibleTrue();

  long countByDisponibleTrueAndBloquePourReservationFalse();

  boolean existsByCodeExemplaire(String codeExemplaire);

  List<Exemplaire> findByLivreId(Long livreId);
}

