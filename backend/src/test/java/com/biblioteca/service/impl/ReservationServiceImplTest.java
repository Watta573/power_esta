package com.biblioteca.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Reservation;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.StatutReservation;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.ReservationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.TypeNotification;
import com.biblioteca.service.EmpruntService;
import com.biblioteca.service.LivreService;
import com.biblioteca.service.NotificationService;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

  @Mock
  private ReservationRepository reservationRepository;
  @Mock
  private UtilisateurRepository utilisateurRepository;
  @Mock
  private LivreRepository livreRepository;
  @Mock
  private LivreService livreService;
  @Mock
  private EmpruntService empruntService;
  @Mock
  private NotificationService notificationService;

  @InjectMocks
  private ReservationServiceImpl service;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(service, "dureeValidite", 3);
  }

  @Test
  void creerReservation_shouldCreateDisponibleWhenBookAvailable() {
    Utilisateur u = Utilisateur.builder().id(1L).build();
    Livre l = Livre.builder().id(2L).titre("Java").build();
    when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(u));
    when(livreRepository.findById(2L)).thenReturn(Optional.of(l));
    when(livreService.obtenirNombreExemplairesDisponibles(2L)).thenReturn(1L);
    when(reservationRepository.countByLivreIdAndStatut(2L, StatutReservation.EN_ATTENTE)).thenReturn(0L);
    when(reservationRepository.countByUtilisateurIdAndStatutIn(1L, List.of(StatutReservation.EN_ATTENTE, StatutReservation.DISPONIBLE)))
        .thenReturn(0L);
    when(livreService.bloquerProchainExemplaireDisponible(2L)).thenReturn(true);
    when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

    Reservation created = service.creerReservation(1L, 2L);

    assertEquals(1, created.getPosition());
    assertEquals(StatutReservation.DISPONIBLE, created.getStatut());
    assertEquals(LocalDate.now().plusDays(3), created.getDateExpiration());
  }

  @Test
  void creerReservation_shouldAssignPositionAndSaveWhenUnavailable() {
    Utilisateur u = Utilisateur.builder().id(1L).build();
    Livre l = Livre.builder().id(2L).titre("Java").build();
    when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(u));
    when(livreRepository.findById(2L)).thenReturn(Optional.of(l));
    when(livreService.obtenirNombreExemplairesDisponibles(2L)).thenReturn(0L);
    when(reservationRepository.countByLivreIdAndStatut(2L, StatutReservation.EN_ATTENTE)).thenReturn(2L);
    when(reservationRepository.countByUtilisateurIdAndStatutIn(1L, List.of(StatutReservation.EN_ATTENTE, StatutReservation.DISPONIBLE)))
        .thenReturn(0L);
    when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

    Reservation created = service.creerReservation(1L, 2L);

    assertEquals(3, created.getPosition());
    assertEquals(StatutReservation.EN_ATTENTE, created.getStatut());
    assertEquals(LocalDate.now().plusDays(3), created.getDateExpiration());
  }

  @Test
  void creerReservation_shouldBlockAvailableCopyWhenNoQueue() {
    Utilisateur u = Utilisateur.builder().id(1L).build();
    Livre l = Livre.builder().id(2L).titre("Java").build();
    when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(u));
    when(livreRepository.findById(2L)).thenReturn(Optional.of(l));
    when(livreService.obtenirNombreExemplairesDisponibles(2L)).thenReturn(1L);
    when(reservationRepository.countByLivreIdAndStatut(2L, StatutReservation.EN_ATTENTE)).thenReturn(0L);
    when(reservationRepository.countByUtilisateurIdAndStatutIn(1L, List.of(StatutReservation.EN_ATTENTE, StatutReservation.DISPONIBLE)))
        .thenReturn(0L);
    when(livreService.bloquerProchainExemplaireDisponible(2L)).thenReturn(true);
    when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

    Reservation created = service.creerReservation(1L, 2L);

    assertEquals(1, created.getPosition());
    assertEquals(StatutReservation.DISPONIBLE, created.getStatut());
    verify(livreService).bloquerProchainExemplaireDisponible(2L);
  }

  @Test
  void notifierProchainEnAttente_shouldPromotePendingReservationWhenAvailableCopyExists() {
    Utilisateur u = Utilisateur.builder().id(1L).build();
    Livre l = Livre.builder().id(2L).titre("Java").build();
    Reservation r = Reservation.builder().id(5L).utilisateur(u).livre(l).statut(StatutReservation.EN_ATTENTE).build();

    when(livreService.obtenirNombreExemplairesDisponibles(2L)).thenReturn(1L);
    when(livreService.obtenirNombreExemplairesBloques(2L)).thenReturn(0L);
    when(reservationRepository.countByLivreIdAndStatut(2L, StatutReservation.DISPONIBLE)).thenReturn(0L);
    when(reservationRepository.findFirstByLivreIdAndStatutOrderByPositionAsc(2L, StatutReservation.EN_ATTENTE))
        .thenReturn(Optional.of(r));
    when(livreService.bloquerProchainExemplaireDisponible(2L)).thenReturn(true);
    when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

    boolean promoted = service.notifierProchainEnAttente(2L);

    assertEquals(true, promoted);
    assertEquals(StatutReservation.DISPONIBLE, r.getStatut());
    verify(livreService).bloquerProchainExemplaireDisponible(2L);
    verify(notificationService).notifier(any(), eq(TypeNotification.LIVRE_DISPONIBLE), anyString(), eq(CanalNotification.INTERNE));
    verify(notificationService).envoyerEmailLivreDisponible(any(), eq("Java"));
  }

  @Test
  void confirmerReservation_shouldCreateEmprunt() {
    Utilisateur u = Utilisateur.builder().id(1L).build();
    Livre l = Livre.builder().id(2L).titre("Java").build();
    Reservation r = Reservation.builder().id(5L).utilisateur(u).livre(l).statut(StatutReservation.DISPONIBLE).build();
    Exemplaire ex = Exemplaire.builder().id(9L).build();

    when(reservationRepository.findById(5L)).thenReturn(Optional.of(r));
    when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));
    when(livreService.obtenirProchainExemplaireBloquePourReservation(2L)).thenThrow(new BusinessException("Aucun exemplaire réservé"));
    when(livreService.obtenirProchainExemplaireDisponible(2L)).thenReturn(ex);

    Reservation confirmed = service.confirmerReservation(5L);

    assertEquals(StatutReservation.CONFIRMEE, confirmed.getStatut());
    verify(empruntService).creerEmprunt(1L, 9L);
  }

  @Test
  void annuler_shouldFailForConfirmed() {
    Reservation r = Reservation.builder().id(7L).statut(StatutReservation.CONFIRMEE).build();
    when(reservationRepository.findById(7L)).thenReturn(Optional.of(r));

    assertThrows(BusinessException.class, () -> service.annuler(7L));
  }
}

