package com.biblioteca.repository;

import com.biblioteca.entity.Notification;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  List<Notification> findByUtilisateurIdOrderByDateEnvoiDesc(Long utilisateurId);

  Page<Notification> findByUtilisateurIdOrderByDateEnvoiDesc(Long utilisateurId, Pageable pageable);

  long countByUtilisateurIdAndLuFalse(Long utilisateurId);
}

