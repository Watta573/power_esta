package com.biblioteca.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.biblioteca.entity.Emprunt;
import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.ExemplaireRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.NotificationService;
import com.biblioteca.service.ReservationService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EmpruntServiceImplTest {

  @Mock
  private EmpruntRepository empruntRepository;
  @Mock
  private UtilisateurRepository utilisateurRepository;
  @Mock
  private ExemplaireRepository exemplaireRepository;
  @Mock
  private NotificationService notificationService;
  @Mock
  private ReservationService reservationService;

  @InjectMocks
  private EmpruntServiceImpl service;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(service, "tarifJournalier", BigDecimal.valueOf(100));
    ReflectionTestUtils.setField(service, "dureeEtudiant", 14);
    ReflectionTestUtils.setField(service, "dureeEnseignant", 21);
    ReflectionTestUtils.setField(service, "dureePublic", 7);
    ReflectionTestUtils.setField(service, "quotaEtudiant", 3);
    ReflectionTestUtils.setField(service, "quotaEnseignant", 5);
    ReflectionTestUtils.setField(service, "quotaPublic", 1);
  }

  @Test
  void creerEmprunt_shouldFailWhenQuotaReached() {
    Utilisateur u = Utilisateur.builder().id(1L).role(Role.ETUDIANT).email("a@a.com").build();
    Exemplaire ex = Exemplaire.builder().id(2L).disponible(true).livre(Livre.builder().titre("Java").build()).build();
    when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(u));
    when(exemplaireRepository.findById(2L)).thenReturn(Optional.of(ex));
    when(empruntRepository.existsByUtilisateurIdAndStatut(1L, StatutEmprunt.EN_RETARD)).thenReturn(false);
    when(empruntRepository.countByUtilisateurIdAndStatut(1L, StatutEmprunt.EN_COURS)).thenReturn(3L);

    assertThrows(BusinessException.class, () -> service.creerEmprunt(1L, 2L));
    verify(empruntRepository, never()).save(any());
  }

  @Test
  void creerEmprunt_shouldCreateAndMarkExemplaireUnavailable() {
    Utilisateur u = Utilisateur.builder().id(1L).role(Role.ETUDIANT).email("a@a.com").build();
    Livre livre = Livre.builder().titre("Java").build();
    Exemplaire ex = Exemplaire.builder().id(2L).disponible(true).livre(livre).build();
    when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(u));
    when(exemplaireRepository.findById(2L)).thenReturn(Optional.of(ex));
    when(empruntRepository.existsByUtilisateurIdAndStatut(1L, StatutEmprunt.EN_RETARD)).thenReturn(false);
    when(empruntRepository.countByUtilisateurIdAndStatut(1L, StatutEmprunt.EN_COURS)).thenReturn(0L);
    when(empruntRepository.save(any(Emprunt.class))).thenAnswer(i -> i.getArgument(0));

    Emprunt created = service.creerEmprunt(1L, 2L);

    assertEquals(StatutEmprunt.EN_COURS, created.getStatut());
    assertFalse(ex.getDisponible());
    assertEquals(LocalDate.now().plusDays(14), created.getDateRetourPrevue());
    verify(exemplaireRepository).save(ex);
    verify(empruntRepository).save(any(Emprunt.class));
  }

  @Test
  void creerEmprunt_shouldFailWhenExemplaireBlockedForReservation() {
    Utilisateur u = Utilisateur.builder().id(1L).role(Role.ETUDIANT).email("a@a.com").build();
    Livre livre = Livre.builder().titre("Java").build();
    Exemplaire ex = Exemplaire.builder().id(2L).disponible(true).bloquePourReservation(true).livre(livre).build();
    when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(u));
    when(exemplaireRepository.findById(2L)).thenReturn(Optional.of(ex));

    assertThrows(BusinessException.class, () -> service.creerEmprunt(1L, 2L));
    verify(empruntRepository, never()).save(any());
  }

  @Test
  void enregistrerRetour_shouldReleaseBlockedExemplaireAndPromoteReservation() {
    Livre livre = Livre.builder().id(2L).titre("Java").build();
    Exemplaire ex = Exemplaire.builder().id(2L).disponible(false).bloquePourReservation(true).livre(livre).build();
    Emprunt e = Emprunt.builder().id(10L).exemplaire(ex).utilisateur(Utilisateur.builder().id(1L).email("a@a.com").build()).dateRetourPrevue(LocalDate.now().minusDays(1)).statut(StatutEmprunt.EN_COURS).build();

    when(empruntRepository.findById(10L)).thenReturn(Optional.of(e));
    when(empruntRepository.save(any(Emprunt.class))).thenAnswer(i -> i.getArgument(0));
    when(exemplaireRepository.save(any(Exemplaire.class))).thenAnswer(i -> i.getArgument(0));
    when(reservationService.notifierProchainEnAttente(2L)).thenReturn(true);

    Emprunt returned = service.enregistrerRetour(10L);

    assertEquals(StatutEmprunt.RETOURNE, returned.getStatut());
    assertFalse(ex.getBloquePourReservation());
    verify(reservationService).notifierProchainEnAttente(2L);
  }

  @Test
  void calculerAmende_shouldComputeDailyAmount() {
    Emprunt e = Emprunt.builder()
        .id(10L)
        .dateRetourPrevue(LocalDate.now().minusDays(3))
        .dateRetourEffective(LocalDate.now())
        .build();
    when(empruntRepository.findById(10L)).thenReturn(Optional.of(e));

    BigDecimal amende = service.calculerAmende(10L);

    assertEquals(BigDecimal.valueOf(300), amende);
  }

  @Test
  void renouvelerEmprunt_shouldIncreaseOnce() {
    Utilisateur u = Utilisateur.builder().id(1L).role(Role.ENSEIGNANT).build();
    Livre livre = Livre.builder().titre("Java").build();
    Exemplaire ex = Exemplaire.builder().livre(livre).build();
    Emprunt e = Emprunt.builder()
        .id(9L)
        .utilisateur(u)
        .exemplaire(ex)
        .dateRetourPrevue(LocalDate.now().plusDays(2))
        .nombreRenouvellements(0)
        .statut(StatutEmprunt.EN_COURS)
        .build();
    when(empruntRepository.findById(9L)).thenReturn(Optional.of(e));
    when(empruntRepository.save(any(Emprunt.class))).thenAnswer(i -> i.getArgument(0));

    Emprunt renewed = service.renouvelerEmprunt(9L);

    assertEquals(1, renewed.getNombreRenouvellements());
    assertTrue(renewed.getDateRetourPrevue().isAfter(LocalDate.now().plusDays(2)));
  }
}

