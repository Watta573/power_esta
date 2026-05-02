package com.biblioteca.repository;

import com.biblioteca.entity.SuggestionAchat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuggestionAchatRepository extends JpaRepository<SuggestionAchat, Long> {
  Page<SuggestionAchat> findAllByOrderByDateDemandeDesc(Pageable pageable);
  Page<SuggestionAchat> findByStatutOrderByDateDemandeDesc(String statut, Pageable pageable);
  Page<SuggestionAchat> findByDemandeurIdOrderByDateDemandeDesc(Long demandeurId, Pageable pageable);
  Page<SuggestionAchat> findByDemandeurIdAndStatutOrderByDateDemandeDesc(Long demandeurId, String statut, Pageable pageable);
}
