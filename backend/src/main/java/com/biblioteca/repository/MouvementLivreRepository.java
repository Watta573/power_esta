package com.biblioteca.repository;

import com.biblioteca.entity.MouvementLivre;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MouvementLivreRepository extends JpaRepository<MouvementLivre, Long> {
  @Query("""
      select m from MouvementLivre m
      where m.exemplaire.livre.id = :livreId
        and (:start is null or m.dateHeure >= :start)
        and (:end is null or m.dateHeure <= :end)
      order by m.dateHeure desc
      """)
  List<MouvementLivre> findHistoriqueLivre(@Param("livreId") Long livreId,
                                           @Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);
}

