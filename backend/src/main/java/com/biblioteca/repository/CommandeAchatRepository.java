package com.biblioteca.repository;

import com.biblioteca.entity.CommandeAchat;
import com.biblioteca.entity.Fournisseur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface CommandeAchatRepository extends JpaRepository<CommandeAchat, Long> {
  Page<CommandeAchat> findAllByOrderByDateCommandeDesc(Pageable pageable);

  long countByFournisseurEntity(Fournisseur fournisseur);

  @Query("SELECT COALESCE(SUM(c.montant), 0) FROM CommandeAchat c WHERE c.statut = 'LIVREE'")
  BigDecimal sumMontantLivrees();

  @Query("SELECT COALESCE(SUM(c.montant), 0) FROM CommandeAchat c WHERE c.statut = 'EN_COURS'")
  BigDecimal sumMontantEnCours();
}
