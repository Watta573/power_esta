package com.biblioteca.service;

import com.biblioteca.dto.ExemplaireCreateRequest;
import com.biblioteca.dto.LivreSaveRequest;
import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.MouvementLivre;
import com.biblioteca.entity.enums.EtatExemplaire;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface LivreService {
  Livre ajouterLivre(LivreSaveRequest dto, MultipartFile couverture);

  Livre modifierLivre(Long id, LivreSaveRequest dto, MultipartFile couverture);

  void desactiverLivre(Long id);

  Livre getLivre(Long id);

  Page<Livre> rechercherLivres(String q,
                              String titre,
                              String auteur,
                              String isbn,
                              Long categorieId,
                              String langue,
                              Integer anneeMin,
                              Integer anneeMax,
                              Boolean dispo,
                              int page,
                              int size);

  long obtenirNombreExemplairesDisponibles(Long livreId);

  long obtenirNombreExemplairesBloques(Long livreId);

  Exemplaire obtenirProchainExemplaireDisponible(Long livreId);

  Exemplaire obtenirProchainExemplaireBloquePourReservation(Long livreId);

  boolean bloquerProchainExemplaireDisponible(Long livreId);

  boolean libererProchainExemplaireBloque(Long livreId);

  List<Exemplaire> listerExemplaires(Long livreId);

  Exemplaire ajouterExemplaire(Long livreId, ExemplaireCreateRequest req);

  Exemplaire modifierEtatExemplaire(Long exemplaireId, EtatExemplaire etat, Boolean disponible);

  List<MouvementLivre> getHistoriqueMouvements(Long livreId, LocalDateTime debut, LocalDateTime fin);
}

