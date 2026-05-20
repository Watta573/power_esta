package com.biblioteca.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "reservations_periodiques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ReservationPeriodique {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "numero_id", nullable = false)
  private NumeroPeriodique numero;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @Column(name = "date_reservation", nullable = false)
  private LocalDateTime dateReservation;

  @Column(name = "date_expiration", nullable = false)
  private LocalDate dateExpiration;

  /** EN_ATTENTE, DISPONIBLE, CONFIRMEE, ANNULEE */
  @Column(nullable = false, length = 20)
  private String statut;

  @Column(name = "date_creation")
  private LocalDateTime dateCreation;

  @PrePersist
  void prePersist() {
    if (dateReservation == null) dateReservation = LocalDateTime.now();
    if (dateExpiration == null) dateExpiration = LocalDate.now().plusDays(3);
    if (statut == null) statut = "EN_ATTENTE";
    if (dateCreation == null) dateCreation = LocalDateTime.now();
  }
}
