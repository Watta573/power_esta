package com.biblioteca.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import com.biblioteca.util.FileStorageService;
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
  private FileStorageService fileStorageService;

  @InjectMocks
  private LivreServiceImpl service;

  @Test
  void ajouterLivre_shouldFailWhenIsbnExists() {
    LivreSaveRequest req = new LivreSaveRequest("t", "isbn", "a", null, null, null, 1L, null, null, null, null);
    when(livreRepository.existsByIsbn("isbn")).thenReturn(true);
    assertThrows(BusinessException.class, () -> service.ajouterLivre(req, null));
  }

  @Test
  void ajouterLivre_shouldSaveWhenOk() {
    Categorie cat = Categorie.builder().id(1L).nom("Info").build();
    LivreSaveRequest req = new LivreSaveRequest("Titre", "isbn", "Auteur", "Ed", null, 2024, 1L, null, "Desc", null, null);
    when(livreRepository.existsByIsbn("isbn")).thenReturn(false);
    when(categorieRepository.findById(1L)).thenReturn(Optional.of(cat));
    when(livreRepository.save(any(Livre.class))).thenAnswer(i -> i.getArgument(0));

    Livre saved = service.ajouterLivre(req, null);

    assertEquals("Titre", saved.getTitre());
    assertEquals(cat, saved.getCategorie());
    assertNotNull(saved.getActif());
    verify(livreRepository).save(any(Livre.class));
  }

  @Test
  void obtenirProchainExemplaireDisponible_shouldThrowWhenNone() {
    when(exemplaireRepository.findFirstByLivreIdAndDisponibleTrueOrderByIdAsc(7L)).thenReturn(Optional.empty());
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
}

