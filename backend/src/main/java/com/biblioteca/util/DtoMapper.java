package com.biblioteca.util;

import com.biblioteca.dto.api.CategorieDto;
import com.biblioteca.dto.api.ExemplaireDto;
import com.biblioteca.dto.api.LivreDto;
import com.biblioteca.dto.api.NotificationDto;
import com.biblioteca.dto.api.UtilisateurDto;
import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.Notification;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.ExemplaireRepository;
import org.springframework.stereotype.Component;

@Component
public class DtoMapper {

  private final EmpruntRepository empruntRepository;
  private final ExemplaireRepository exemplaireRepository;

  public DtoMapper(EmpruntRepository empruntRepository,
                   ExemplaireRepository exemplaireRepository) {
    this.empruntRepository = empruntRepository;
    this.exemplaireRepository = exemplaireRepository;
  }

  public UtilisateurDto toUtilisateurDto(Utilisateur u) {
    if (u == null) return null;
    long enCours = empruntRepository.countByUtilisateurIdAndStatut(u.getId(), StatutEmprunt.EN_COURS);
    long retards = empruntRepository.countByUtilisateurIdAndStatut(u.getId(), StatutEmprunt.EN_RETARD);
    return new UtilisateurDto(
        u.getId(), u.getNom(), u.getPrenom(), u.getIdentifiant(), u.getEmail(),
        u.getTelephone(), u.getRole(), Boolean.TRUE.equals(u.getActif()),
        u.getDateInscription() == null ? null : u.getDateInscription().toString(),
        u.getPhotoUrl(), enCours, retards
    );
  }

  public LivreDto toLivreDto(Livre livre) {
    if (livre == null) return null;
    CategorieDto categorie = livre.getCategorie() == null ? null
        : new CategorieDto(livre.getCategorie().getId(), livre.getCategorie().getNom(),
            livre.getCategorie().getCouleur());
    long disponibles = exemplaireRepository.countByLivreIdAndDisponibleTrue(livre.getId());
    long total = exemplaireRepository.countByLivreId(livre.getId());
    return new LivreDto(
        livre.getId(), livre.getTitre(), livre.getAuteur(), livre.getIsbn(),
        livre.getEditeur(), livre.getEdition(), livre.getAnneePublication(),
        categorie, livre.getLangue(), livre.getDescription(), livre.getCouverture(),
        total, disponibles, Boolean.TRUE.equals(livre.getActif())
    );
  }

  public ExemplaireDto toExemplaireDto(Exemplaire ex) {
    if (ex == null) return null;
    return new ExemplaireDto(ex.getId(), ex.getCodeExemplaire(), ex.getEtat(),
        Boolean.TRUE.equals(ex.getDisponible()), ex.getLocalisation());
  }

  public NotificationDto toNotificationDto(Notification n) {
    if (n == null) return null;
    return new NotificationDto(
        n.getId(), n.getType(), n.getMessage(),
        n.getDateEnvoi() == null ? null : n.getDateEnvoi().toString(),
        Boolean.TRUE.equals(n.getLu()), n.getCanal()
    );
  }
}
