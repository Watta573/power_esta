package com.biblioteca.entity;

import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.TypeNotification;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private TypeNotification type;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(nullable = false)
  private LocalDateTime dateEnvoi;

  @Column(nullable = false)
  private Boolean lu;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private CanalNotification canal;

  @PrePersist
  void prePersist() {
    if (dateEnvoi == null) dateEnvoi = LocalDateTime.now();
    if (lu == null) lu = false;
    if (canal == null) canal = CanalNotification.INTERNE;
  }
}

