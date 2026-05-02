package com.biblioteca.repository;

import com.biblioteca.entity.DiffusionGroupee;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiffusionGroupeeRepository extends JpaRepository<DiffusionGroupee, Long> {
  Page<DiffusionGroupee> findAllByOrderByDateEnvoiDesc(Pageable pageable);
  List<DiffusionGroupee> findByStatutAndDateEnvoiProgrammeBefore(String statut, LocalDateTime now);
}
