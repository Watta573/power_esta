package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_utilisateur", columnList = "utilisateur_id"),
    @Index(name = "idx_audit_date", columnList = "date_action")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "utilisateur_id")
  private Long utilisateurId;

  @Column(length = 180)
  private String email;

  @Column(length = 30)
  private String role;

  @Column(nullable = false, length = 60)
  private String action;

  @Column(length = 255)
  private String details;

  @Column(length = 60)
  private String ipAddress;

  @Column(name = "date_action", nullable = false)
  private LocalDateTime dateAction;

  @Column(nullable = false, length = 10)
  private String statut; // SUCCESS / FAILURE

  @PrePersist
  void prePersist() {
    if (dateAction == null) dateAction = LocalDateTime.now();
  }
}
