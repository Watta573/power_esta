package com.biblioteca.entity;

import com.biblioteca.entity.enums.StatutReservation;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "livre_id", nullable = false)
  private Livre livre;

  @Column(nullable = false)
  private LocalDateTime dateReservation;

  @Column(nullable = false)
  private LocalDate dateExpiration;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private StatutReservation statut;

  @Column(nullable = false)
  private Integer position;

  @Column(nullable = false)
  private Boolean notifie;

  @PrePersist
  void prePersist() {
    if (dateReservation == null) dateReservation = LocalDateTime.now();
    if (dateExpiration == null) dateExpiration = LocalDate.now().plusDays(3);
    if (statut == null) statut = StatutReservation.EN_ATTENTE;
    if (position == null) position = 1;
    if (notifie == null) notifie = false;
  }
}

