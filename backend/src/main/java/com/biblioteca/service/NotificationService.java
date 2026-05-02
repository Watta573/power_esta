package com.biblioteca.service;

import com.biblioteca.entity.Notification;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.TypeNotification;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

  Notification notifier(Utilisateur utilisateur, TypeNotification type,
                        String message, CanalNotification canal);

  void envoyerEmail(String destinataire, String sujet, String corps);

  void envoyerEmailBienvenue(Utilisateur utilisateur);

  void envoyerEmailEmprunt(Utilisateur utilisateur, String titreLivre, String dateRetour);

  void envoyerEmailRetourConfirme(Utilisateur utilisateur, String titreLivre);

  void envoyerEmailReservationCreee(Utilisateur utilisateur, String titreLivre, int position);

  void envoyerEmailNouveauLivre(Utilisateur utilisateur, String titreLivre, String auteur, String categorie);

  void envoyerEmailRetard(Utilisateur utilisateur, String titreLivre, long joursRetard);

  void envoyerEmailLivreDisponible(Utilisateur utilisateur, String titreLivre);

  void envoyerEmailAmende(Utilisateur utilisateur, String titreLivre, double montant);

  void envoyerEmailEmpruntProlonge(Utilisateur utilisateur, String titreLivre, String nouvelleDateRetour);

  void envoyerEmailReservationExpiree(Utilisateur utilisateur, String titreLivre);

  void envoyerEmailReservationAnnulee(Utilisateur utilisateur, String titreLivre);

  List<Notification> listerUtilisateur(Long utilisateurId);

  Page<Notification> listerUtilisateurPage(Long utilisateurId, Pageable pageable);

  long countNonLues(Long utilisateurId);

  void marquerCommeLu(Long id);

  void marquerToutCommeLu(Long utilisateurId);

  void envoyerGroupee(java.util.List<String> roles, String sujet, String message, String type,
                      String dateEnvoiProgramme, Long expediteurId);

  org.springframework.data.domain.Page<com.biblioteca.entity.DiffusionGroupee> getHistoriqueDiffusions(
      org.springframework.data.domain.Pageable pageable);

  int traiterDiffusionsProgrammees();

  /** @deprecated use envoyerGroupee with sujet/expediteurId */
  @Deprecated
  default void envoyerGroupee(java.util.List<String> roles, String message, String type) {
    envoyerGroupee(roles, "Message de la Bibliothèque ESTA", message, type, null, null);
  }
}
