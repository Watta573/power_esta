package com.biblioteca.repository;

import com.biblioteca.entity.Emprunt;
import com.biblioteca.entity.enums.StatutEmprunt;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmpruntRepository extends JpaRepository<Emprunt, Long> {
  long countByUtilisateurIdAndStatut(Long utilisateurId, StatutEmprunt statut);

  long countByStatut(StatutEmprunt statut);

  // Méthode pour le top 5 des livres
  @Query(value = "SELECT l.id, l.titre, l.auteur, COUNT(e.id) as nbEmprunts " +
         "FROM emprunts e " +
         "JOIN exemplaires ex ON e.exemplaire_id = ex.id " +
         "JOIN livres l ON ex.livre_id = l.id " +
         "GROUP BY l.id, l.titre, l.auteur " +
         "ORDER BY COUNT(e.id) DESC " +
         "LIMIT 5", nativeQuery = true)
  List<Object[]> findTop5LivresByNbEmprunts();

  List<Emprunt> findByUtilisateurIdOrderByDateEmpruntDesc(Long utilisateurId);

  List<Emprunt> findByStatutIn(List<StatutEmprunt> statuts);

  List<Emprunt> findByDateRetourPrevueBeforeAndStatut(LocalDate date, StatutEmprunt statut);

  List<Emprunt> findByDateRetourPrevueAndStatut(LocalDate date, StatutEmprunt statut);

  boolean existsByUtilisateurIdAndStatut(Long utilisateurId, StatutEmprunt statut);

  long countByDateEmprunt(LocalDate dateEmprunt);

  Page<Emprunt> findByStatut(StatutEmprunt statut, Pageable pageable);

  Page<Emprunt> findByUtilisateurId(Long utilisateurId, Pageable pageable);

  Page<Emprunt> findByUtilisateurIdAndStatut(Long utilisateurId, StatutEmprunt statut, Pageable pageable);

  @Query("select e from Emprunt e where e.exemplaire.livre.id = :livreId order by e.dateEmprunt desc")
  Page<Emprunt> findByLivreId(@Param("livreId") Long livreId, Pageable pageable);

  @Query("select e.dateEmprunt, count(e) from Emprunt e where e.dateEmprunt between :debut and :fin group by e.dateEmprunt")
  List<Object[]> countByDateEmpruntBetweenGroupByDate(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

  @Query("select e.exemplaire.livre, count(e) from Emprunt e where e.exemplaire is not null group by e.exemplaire.livre order by count(e) desc")
  List<Object[]> findTopLivresParNombreEmprunts(Pageable pageable);

  @Query("select coalesce(sum(e.amende), 0) from Emprunt e")
  java.math.BigDecimal sumAmendes();

  @Query("select e from Emprunt e where e.amende > 0 order by e.dateRetourEffective desc nulls last")
  Page<Emprunt> findAllAmendes(Pageable pageable);

  @Query("select e from Emprunt e where e.amende > 0 and e.amendePayee = :payee order by e.dateRetourEffective desc nulls last")
  Page<Emprunt> findAmendesByPayee(@Param("payee") boolean payee, Pageable pageable);
}

