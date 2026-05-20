package com.biblioteca.service;

import com.biblioteca.entity.*;
import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CirculationAvanceeService {

    private final RegleCirculationRepository regleRepository;
    private final EmpruntRepository empruntRepository;

    public CirculationAvanceeService(
            RegleCirculationRepository regleRepository,
            EmpruntRepository empruntRepository) {
        this.regleRepository = regleRepository;
        this.empruntRepository = empruntRepository;
    }

    /**
     * Obtient la règle de circulation applicable
     */
    public RegleCirculation getRegleApplicable(Utilisateur utilisateur, String typeDocument) {
        String typeUtilisateur = utilisateur.getRole().name();
        
        return regleRepository.findByTypeUtilisateurAndTypeDocumentAndActifTrue(
                typeUtilisateur, typeDocument)
                .orElse(regleRepository.findByTypeUtilisateurAndTypeDocumentAndActifTrue(
                        typeUtilisateur, "LIVRE").orElse(getRegleParDefaut()));
    }

    /**
     * Vérifie si un utilisateur peut emprunter
     */
    public boolean peutEmprunter(Utilisateur utilisateur, Livre livre) {
        RegleCirculation regle = getRegleApplicable(utilisateur, "LIVRE");

        if (!Boolean.TRUE.equals(utilisateur.getActif())) {
            return false;
        }

        if (empruntRepository.existsByUtilisateurIdAndStatut(utilisateur.getId(), StatutEmprunt.EN_RETARD)) {
            return false;
        }

        long empruntsEnCours = empruntRepository.countByUtilisateurIdAndStatut(
                utilisateur.getId(), StatutEmprunt.EN_COURS);

        Integer maxEmprunts = regle.getNbEmpruntsMax();
        return maxEmprunts == null || empruntsEnCours < maxEmprunts;
    }

    /**
     * Calcule la date de retour prévue
     */
    public LocalDate calculerDateRetourPrevue(Utilisateur utilisateur, String typeDocument) {
        RegleCirculation regle = getRegleApplicable(utilisateur, typeDocument);
        LocalDate dateRetour = LocalDate.now().plusDays(regle.getDureePretJours());
        
        // Ajuster pour éviter les jours de fermeture (weekend pour l'instant)
        return ajusterDatePourWeekend(dateRetour);
    }

    /**
     * Calcule l'amende pour un emprunt en retard
     */
    public BigDecimal calculerAmende(Emprunt emprunt) {
        if (emprunt.getDateRetourEffective() != null || 
            emprunt.getDateRetourPrevue().isAfter(LocalDate.now())) {
            return BigDecimal.ZERO;
        }
        
        RegleCirculation regle = getRegleApplicable(
                emprunt.getUtilisateur(), "LIVRE");
        
        long joursRetard = ChronoUnit.DAYS.between(
                emprunt.getDateRetourPrevue(), LocalDate.now());
        
        BigDecimal amende = regle.getAmendeParJour()
                .multiply(BigDecimal.valueOf(joursRetard));
        
        // Plafonner à l'amende maximum
        return amende.min(regle.getAmendeMax());
    }

    /**
     * Vérifie si un renouvellement est possible
     */
    public boolean peutRenouveler(Emprunt emprunt) {
        RegleCirculation regle = getRegleApplicable(
                emprunt.getUtilisateur(), "LIVRE");
        
        // Vérifier le nombre de renouvellements
        if (emprunt.getNombreRenouvellements() >= regle.getNbRenouvellements()) {
            return false;
        }
        
        // Vérifier qu'il n'y a pas d'amende impayée
        return emprunt.getAmende() == null || 
               emprunt.getAmende().compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Renouvelle un emprunt
     */
    public Emprunt renouvelerEmprunt(Long empruntId) {
        Emprunt emprunt = empruntRepository.findById(empruntId)
                .orElseThrow(() -> new RuntimeException("Emprunt introuvable"));
        
        if (!peutRenouveler(emprunt)) {
            throw new RuntimeException("Renouvellement impossible");
        }
        
        RegleCirculation regle = getRegleApplicable(
                emprunt.getUtilisateur(), "LIVRE");
        
        LocalDate nouvelleDate = LocalDate.now().plusDays(regle.getDureePretJours());
        emprunt.setDateRetourPrevue(ajusterDatePourWeekend(nouvelleDate));
        emprunt.setNombreRenouvellements(emprunt.getNombreRenouvellements() + 1);
        
        return empruntRepository.save(emprunt);
    }

    /**
     * Met à jour les amendes pour tous les emprunts en retard
     */
    @Transactional
    public void mettreAJourAmendes() {
        LocalDate now = LocalDate.now();
        List<Emprunt> emprunts = empruntRepository.findByStatutIn(
                List.of(StatutEmprunt.EN_COURS, StatutEmprunt.EN_RETARD));
        List<Emprunt> aMettreAJour = new ArrayList<>();

        for (Emprunt emprunt : emprunts) {
            if (emprunt.getDateRetourPrevue() == null ||
                !emprunt.getDateRetourPrevue().isBefore(now) ||
                emprunt.getDateRetourEffective() != null) {
                continue;
            }

            BigDecimal amende = calculerAmende(emprunt);
            emprunt.setAmende(amende);
            if (emprunt.getStatut() == StatutEmprunt.EN_COURS) {
                emprunt.setStatut(StatutEmprunt.EN_RETARD);
            }
            aMettreAJour.add(emprunt);
        }

        if (!aMettreAJour.isEmpty()) {
            empruntRepository.saveAll(aMettreAJour);
        }
    }

    /**
     * Obtient toutes les règles actives
     */
    public List<RegleCirculation> obtenirReglesActives() {
        return regleRepository.findByActifTrueOrderByTypeUtilisateurAscTypeDocumentAsc();
    }

    // Méthodes utilitaires privées
    
    private RegleCirculation getRegleParDefaut() {
        RegleCirculation regle = new RegleCirculation();
        regle.setNom("Règle par défaut");
        regle.setTypeUtilisateur("ETUDIANT");
        regle.setTypeDocument("LIVRE");
        regle.setDureePretJours(14);
        regle.setNbRenouvellements(2);
        regle.setNbEmpruntsMax(5);
        regle.setAmendeParJour(BigDecimal.valueOf(0.50));
        regle.setAmendeMax(BigDecimal.valueOf(30.00));
        return regle;
    }

    private LocalDate ajusterDatePourWeekend(LocalDate date) {
        // Éviter les weekends (samedi = 6, dimanche = 7)
        while (date.getDayOfWeek().getValue() >= 6) {
            date = date.plusDays(1);
        }
        return date;
    }
}