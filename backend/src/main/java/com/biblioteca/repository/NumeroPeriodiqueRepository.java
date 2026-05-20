package com.biblioteca.repository;

import com.biblioteca.entity.NumeroPeriodique;
import com.biblioteca.entity.enums.StatutNumeroPeriodique;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NumeroPeriodiqueRepository extends JpaRepository<NumeroPeriodique, Long> {
  Page<NumeroPeriodique> findByPeriodiqueIdOrderByDateParutionDesc(Long periodiqueId, Pageable pageable);
  List<NumeroPeriodique> findByPeriodiqueIdOrderByDateParutionDesc(Long periodiqueId);
  List<NumeroPeriodique> findByStatutAndDateParutionBefore(StatutNumeroPeriodique statut, LocalDate date);
  Page<NumeroPeriodique> findByPeriodiqueIdAndStatutOrderByDateParutionDesc(Long periodiqueId, StatutNumeroPeriodique statut, Pageable pageable);
}
