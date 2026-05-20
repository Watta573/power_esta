package com.biblioteca.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.biblioteca.dto.ExemplaireCreateRequest;
import com.biblioteca.dto.LivreSaveRequest;
import com.biblioteca.entity.Categorie;
import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.enums.EtatExemplaire;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CategorieRepository;
import com.biblioteca.repository.ExemplaireRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.MouvementLivreRepository;
import com.biblioteca.repository.ReservationRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.ReservationService;
import com.biblioteca.util.FileStorageService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LivreServiceImplTest {

  @Mock
  private LivreRepository livreRepository;
  @Mock
  private CategorieRepository categorieRepository;
  @Mock
  private ExemplaireRepository exemplaireRepository;
  @Mock
  private MouvementLivreRepository mouvementLivreRepository;
  @Mock
  private ReservationService reservationService;
  @Mock
  private UtilisateurRepository utilisateurRepository;
  @Mock
  private FileStorageService fileStorageService;

  @InjectMocks
  private LivreServiceImpl service;

  @Test
  void ajouterLivre_shouldFailWhenIsbnExists() {
    LivreSaveRequest req = new LivreSaveRequest("t", "isbn", "a", null, null, null, 1L, null, null, null, null, false);
    when(livreRepository.existsByIsbn("isbn")).thenReturn(true);
    assertThrows(BusinessException.class, () -> service.ajouterLivre(req, null));
  }

  @Test
  void ajouterLivre_shouldSaveWhenOk() {
    Categorie cat = Categorie.builder().id(1L).nom("Info").build();
    LivreSaveRequest req = new LivreSaveRequest("Titre", "isbn", "Auteur", "Ed", null, 2024, 1L, null, "Desc", null, null, false);
    when(livreRepository.existsByIsbn("isbn")).thenReturn(false);
    when(categorieRepository.findById(1L)).thenReturn(Optional.of(cat));
    when(utilisateurRepository.findByNotifEmailNouveauLivreTrue()).thenReturn(List.of());
    when(livreRepository.save(any(Livre.class))).thenAnswer(i -> i.getArgument(0));

    Livre saved = service.ajouterLivre(req, null);

    assertEquals("Titre", saved.getTitre());
    assertEquals(cat, saved.getCategorie());
    assertNotNull(saved.getActif());
    verify(livreRepository).save(any(Livre.class));
  }

  @Test
  void obtenirProchainExemplaireDisponible_shouldThrowWhenNone() {
    when(exemplaireRepository.findFirstByLivreIdAndDisponibleTrueAndBloquePourReservationFalseOrderByIdAsc(7L))
        .thenReturn(Optional.empty());
    assertThrows(BusinessException.class, () -> service.obtenirProchainExemplaireDisponible(7L));
  }

  @Test
  void ajouterExemplaire_shouldFailWhenCodeExists() {
    when(exemplaireRepository.existsByCodeExemplaire("EXP-1")).thenReturn(true);
    ExemplaireCreateRequest req = new ExemplaireCreateRequest("EXP-1", EtatExemplaire.BON, true, "A1");
    assertThrows(BusinessException.class, () -> service.ajouterExemplaire(1L, req));
  }

  @Test
  void modifierEtatExemplaire_shouldSave() {
    Exemplaire ex = Exemplaire.builder().id(9L).etat(EtatExemplaire.BON).disponible(true).build();
    when(exemplaireRepository.findById(9L)).thenReturn(Optional.of(ex));
    when(exemplaireRepository.save(any(Exemplaire.class))).thenAnswer(i -> i.getArgument(0));

    Exemplaire saved = service.modifierEtatExemplaire(9L, EtatExemplaire.ABIME, false);

    assertEquals(EtatExemplaire.ABIME, saved.getEtat());
    assertEquals(false, saved.getDisponible());
    verify(exemplaireRepository).save(any(Exemplaire.class));
  }

  @Test
  void ajouterExemplaire_shouldNotifyPendingReservationWhenDisponible() {
    Livre livre = Livre.builder().id(1L).build();
    when(livreRepository.findById(1L)).thenReturn(Optional.of(livre));
    when(exemplaireRepository.existsByCodeExemplaire("EXP-1")).thenReturn(false);
    when(exemplaireRepository.save(any(Exemplaire.class))).thenAnswer(i -> i.getArgument(0));

    ExemplaireCreateRequest req = new ExemplaireCreateRequest("EXP-1", EtatExemplaire.BON, true, "A1");
    Exemplaire saved = service.ajouterExemplaire(1L, req);

    assertNotNull(saved);
    verify(reservationService).notifierProchainEnAttente(1L);
  }

  @Test
  void modifierEtatExemplaire_shouldNotifyPendingReservationWhenMadeAvailable() {
    Livre livre = Livre.builder().id(1L).build();
    Exemplaire ex = Exemplaire.builder().id(9L).livre(livre).etat(EtatExemplaire.BON).disponible(false).build();
    when(exemplaireRepository.findById(9L)).thenReturn(Optional.of(ex));
    when(exemplaireRepository.save(any(Exemplaire.class))).thenAnswer(i -> i.getArgument(0));

    Exemplaire saved = service.modifierEtatExemplaire(9L, EtatExemplaire.BON, true);

    assertEquals(true, saved.getDisponible());
    verify(reservationService).notifierProchainEnAttente(1L);
  }

  @Test
  void bloquerProchainExemplaireDisponible_shouldMarkAvailableCopyAsBlocked() {
    Livre livre = Livre.builder().id(1L).build();
    Exemplaire ex = Exemplaire.builder().id(9L).livre(livre).etat(EtatExemplaire.BON).disponible(true).bloquePourReservation(false).build();
    when(exemplaireRepository.findFirstByLivreIdAndDisponibleTrueAndBloquePourReservationFalseOrderByIdAsc(1L))
        .thenReturn(Optional.of(ex));
    when(exemplaireRepository.save(any(Exemplaire.class))).thenAnswer(i -> i.getArgument(0));

    boolean blocked = service.bloquerProchainExemplaireDisponible(1L);

    assertTrue(blocked);
    assertTrue(ex.getBloquePourReservation());
  }

  @Test
  void libererProchainExemplaireBloque_shouldReleaseBlockedCopy() {
    Livre livre = Livre.builder().id(1L).build();
    Exemplaire ex = Exemplaire.builder().id(9L).livre(livre).etat(EtatExemplaire.BON).disponible(false).bloquePourReservation(true).build();
    when(exemplaireRepository.findFirstByLivreIdAndBloquePourReservationTrueOrderByIdAsc(1L))
        .thenReturn(Optional.of(ex));
    when(exemplaireRepository.save(any(Exemplaire.class))).thenAnswer(i -> i.getArgument(0));

    boolean released = service.libererProchainExemplaireBloque(1L);

    assertTrue(released);
    assertTrue(ex.getDisponible());
    assertEquals(false, ex.getBloquePourReservation());
  }
}

