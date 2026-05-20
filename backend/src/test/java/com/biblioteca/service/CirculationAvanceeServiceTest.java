package com.biblioteca.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.biblioteca.entity.Emprunt;
import com.biblioteca.entity.RegleCirculation;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.RegleCirculationRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CirculationAvanceeServiceTest {

  @Mock
  private RegleCirculationRepository regleRepository;

  @Mock
  private EmpruntRepository empruntRepository;

  @InjectMocks
  private CirculationAvanceeService service;

  @Test
  void mettreAJourAmendes_shouldUpdateOverdueEmpruntsAndPersistChanges() {
    Utilisateur utilisateur = Utilisateur.builder()
        .id(1L)
        .role(Role.ETUDIANT)
        .build();

    RegleCirculation regle = RegleCirculation.builder()
        .typeUtilisateur("ETUDIANT")
        .typeDocument("LIVRE")
        .amendeParJour(BigDecimal.valueOf(0.50))
        .amendeMax(BigDecimal.valueOf(30.00))
        .build();

    Emprunt emprunt = Emprunt.builder()
        .id(10L)
        .utilisateur(utilisateur)
        .dateRetourPrevue(LocalDate.now().minusDays(3))
        .statut(StatutEmprunt.EN_COURS)
        .amende(BigDecimal.ZERO)
        .build();

    when(regleRepository.findByTypeUtilisateurAndTypeDocumentAndActifTrue("ETUDIANT", "LIVRE"))
        .thenReturn(Optional.of(regle));
    when(empruntRepository.findByStatutIn(any()))
        .thenReturn(List.of(emprunt));
    when(empruntRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

    service.mettreAJourAmendes();

    assertEquals(0, emprunt.getAmende().compareTo(new BigDecimal("1.50")));
    assertEquals(StatutEmprunt.EN_RETARD, emprunt.getStatut());
    verify(empruntRepository).saveAll(anyList());
  }
}
