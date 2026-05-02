package com.biblioteca.repository;

import com.biblioteca.entity.ListeLecture;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListeLectureRepository extends JpaRepository<ListeLecture, Long> {
  List<ListeLecture> findByEnseignantIdOrderByDateCreationDesc(Long enseignantId);
  Page<ListeLecture> findByPubliqueTrue(Pageable pageable);
  Page<ListeLecture> findAllByOrderByDateCreationDesc(Pageable pageable);
}
