package com.biblioteca.controller.api;

import com.biblioteca.entity.StatistiquesCirculation;
import com.biblioteca.repository.*;
import com.biblioteca.security.RequirePermission;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/statistiques", produces = MediaType.APPLICATION_JSON_VALUE)
public class StatistiquesApiController {

    private final EmpruntRepository empruntRepository;
    private final ReservationRepository reservationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StatistiquesCirculationRepository statistiquesRepository;
    private final LivreRepository livreRepository;
    private final ExemplaireRepository exemplaireRepository;
    private final CategorieRepository categorieRepository;

    public StatistiquesApiController(
            EmpruntRepository empruntRepository,
            ReservationRepository reservationRepository,
            UtilisateurRepository utilisateurRepository,
            StatistiquesCirculationRepository statistiquesRepository,
            LivreRepository livreRepository,
            ExemplaireRepository exemplaireRepository,
            CategorieRepository categorieRepository) {
        this.empruntRepository = empruntRepository;
        this.reservationRepository = reservationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.statistiquesRepository = statistiquesRepository;
        this.livreRepository = livreRepository;
        this.exemplaireRepository = exemplaireRepository;
        this.categorieRepository = categorieRepository;
    }

    // DTOs pour les réponses
    public record DashboardStatsDto(
            int totalLivres,
            int exemplairesDisponibles,
            int empruntsEnCours,
            int retardsEnCours,
            int reservationsEnAttente,
            int empruntsAujourdhui,
            double amendeTotal,
            List<TopLivreDto> topLivres,
            List<EmpruntsParJourDto> empruntsParJour,
            List<RepartitionCategorieDto> repartitionCategories
    ) {}

    public record TopLivreDto(LivreDto livre, int nbEmprunts) {}
    
    public record LivreDto(int id, String titre, String auteur) {}
    
    public record EmpruntsParJourDto(String date, int count) {}
    
    public record RepartitionCategorieDto(String categorie, int count) {}

    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        LocalDate aujourdhui = LocalDate.now();
        LocalDate il30Jours = aujourdhui.minusDays(30);

        try {
            // Statistiques principales - VRAIES DONNÉES
            long totalLivres = livreRepository.count();
            long totalExemplaires = exemplaireRepository.count();
            long exemplairesDisponibles = exemplaireRepository.countByDisponibleTrue();
            
            // Utiliser les enums pour les statuts
            long empruntsEnCours = empruntRepository.countByStatut(com.biblioteca.entity.enums.StatutEmprunt.EN_COURS);
            long retardsEnCours = empruntRepository.countByStatut(com.biblioteca.entity.enums.StatutEmprunt.EN_RETARD);
            long reservationsEnAttente = reservationRepository.countByStatut(com.biblioteca.entity.enums.StatutReservation.EN_ATTENTE);
            long empruntsAujourdhui = empruntRepository.countByDateEmprunt(aujourdhui);
            
            // Calcul du total des amendes - utiliser la méthode existante
            java.math.BigDecimal amendeTotalBD = empruntRepository.sumAmendes();
            double amendeTotal = amendeTotalBD != null ? amendeTotalBD.doubleValue() : 0.0;
            
            // Top 5 livres les plus empruntés - VRAIES DONNÉES
            List<Object[]> topLivresData = empruntRepository.findTop5LivresByNbEmprunts();
            List<TopLivreDto> topLivres = topLivresData.stream()
                    .map(row -> new TopLivreDto(
                            new LivreDto(
                                    ((Number) row[0]).intValue(), // id
                                    (String) row[1],               // titre
                                    (String) row[2]                // auteur
                            ),
                            ((Number) row[3]).intValue()           // nbEmprunts
                    ))
                    .collect(Collectors.toList());

            // Évolution des emprunts (derniers 30 jours) - VRAIES DONNÉES
            List<EmpruntsParJourDto> empruntsParJour = new ArrayList<>();
            for (int i = 29; i >= 0; i--) {
                LocalDate date = aujourdhui.minusDays(i);
                long count = empruntRepository.countByDateEmprunt(date);
                empruntsParJour.add(new EmpruntsParJourDto(
                        date.format(DateTimeFormatter.ofPattern("dd/MM")),
                        (int) count
                ));
            }
            
            // Répartition par catégories - VRAIES DONNÉES
            List<Object[]> categoriesData = livreRepository.countLivresByCategorie();
            List<RepartitionCategorieDto> repartitionCategories = categoriesData.stream()
                    .map(row -> new RepartitionCategorieDto(
                            (String) row[0],                    // nom catégorie
                            ((Number) row[1]).intValue()        // count
                    ))
                    .collect(Collectors.toList());

            return new DashboardStatsDto(
                    (int) totalLivres,
                    (int) exemplairesDisponibles,
                    (int) empruntsEnCours,
                    (int) retardsEnCours,
                    (int) reservationsEnAttente,
                    (int) empruntsAujourdhui,
                    amendeTotal,
                    topLivres,
                    empruntsParJour,
                    repartitionCategories
            );
        } catch (Exception e) {
            // En cas d'erreur, retourner des données par défaut
            System.err.println("Erreur lors de la récupération des statistiques: " + e.getMessage());
            e.printStackTrace();
            
            return new DashboardStatsDto(
                    0, 0, 0, 0, 0, 0, 0.0,
                    new ArrayList<>(),
                    new ArrayList<>(),
                    new ArrayList<>()
            );
        }
    }

    public record PublicDashboardStatsDto(
            int totalLivres,
            int exemplairesDisponibles,
            int empruntsEnCours,
            int reservationsEnAttente,
            List<TopLivreDto> topLivres
    ) {}

    @GetMapping({"/public", "/public-v2"})
    @Transactional(readOnly = true)
    public PublicDashboardStatsDto getPublicStats() {
        LocalDate aujourdhui = LocalDate.now();
        try {
            long totalLivres = livreRepository.count();
            long exemplairesDisponibles = exemplaireRepository.countByDisponibleTrue();
            long empruntsEnCours = empruntRepository.countByStatut(com.biblioteca.entity.enums.StatutEmprunt.EN_COURS);
            long reservationsEnAttente = reservationRepository.countByStatut(com.biblioteca.entity.enums.StatutReservation.EN_ATTENTE);

            List<Object[]> topLivresData = empruntRepository.findTop5LivresByNbEmprunts();
            List<TopLivreDto> topLivres = topLivresData.stream()
                    .map(row -> new TopLivreDto(
                            new LivreDto(
                                    ((Number) row[0]).intValue(),
                                    (String) row[1],
                                    (String) row[2]
                            ),
                            ((Number) row[3]).intValue()
                    ))
                    .collect(Collectors.toList());

            return new PublicDashboardStatsDto(
                    (int) totalLivres,
                    (int) exemplairesDisponibles,
                    (int) empruntsEnCours,
                    (int) reservationsEnAttente,
                    topLivres
            );
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des statistiques publiques: " + e.getMessage());
            e.printStackTrace();
            return new PublicDashboardStatsDto(0, 0, 0, 0, new ArrayList<>());
        }
    }

    @GetMapping("/collection")
    @RequirePermission("REPORTS_INVENTORY")
    @Transactional(readOnly = true)
    public Map<String, Object> getStatsCollection() {
        Map<String, Object> stats = new HashMap<>();
        
        // Statistiques générales de la collection (simulées)
        stats.put("totalLivres", 1250);
        stats.put("totalExemplaires", 3200);
        stats.put("exemplairesDisponibles", 2800);
        stats.put("exemplairesEmpruntes", 400);
        
        // Répartition par catégorie (simulée)
        Map<String, Integer> categoriesMap = Map.of(
                "Informatique", 320,
                "Mathématiques", 280,
                "Littérature", 250,
                "Histoire", 200,
                "Sciences", 180,
                "Autres", 20
        );
        stats.put("repartitionCategories", categoriesMap);
        
        // Taux de rotation par catégorie (simulé)
        Map<String, Double> rotationMap = Map.of(
                "Informatique", 2.5,
                "Mathématiques", 1.8,
                "Littérature", 3.2,
                "Histoire", 1.5,
                "Sciences", 2.1
        );
        stats.put("tauxRotation", rotationMap);
        
        return stats;
    }

    @PostMapping("/generer-journaliere")
    @RequirePermission("ADMIN_SYSTEM_CONFIG")
    @Transactional
    public void genererStatistiquesJournalieres(@RequestParam LocalDate date) {
        // Vérifier si les statistiques existent déjà
        if (statistiquesRepository.findByDateStat(date).isPresent()) {
            return; // Déjà générées
        }
        
        // Calculer les statistiques du jour (simulées pour l'instant)
        int nbEmprunts = (int) (Math.random() * 20) + 5;
        int nbRetours = (int) (Math.random() * 15) + 3;
        int nbReservations = (int) (Math.random() * 8) + 1;
        int nbNouveauxLecteurs = (int) (Math.random() * 3) + 1;
        
        // Calculer le montant des amendes générées ce jour (simulé)
        BigDecimal montantAmendes = BigDecimal.valueOf(Math.random() * 50 + 10);
        
        // Créer l'enregistrement de statistiques
        StatistiquesCirculation stats = StatistiquesCirculation.builder()
                .dateStat(date)
                .nbEmprunts(nbEmprunts)
                .nbRetours(nbRetours)
                .nbReservations(nbReservations)
                .nbNouveauxLecteurs(nbNouveauxLecteurs)
                .montantAmendes(montantAmendes)
                .build();
        
        statistiquesRepository.save(stats);
    }

    @GetMapping("/resume")
    @RequirePermission("REPORTS_VIEW")
    @Transactional(readOnly = true)
    public Map<String, Object> getResumeActivite() {
        LocalDate aujourdhui = LocalDate.now();
        LocalDate debutMois = aujourdhui.withDayOfMonth(1);
        
        Map<String, Object> resume = new HashMap<>();
        
        // Statistiques du mois (simulées)
        resume.put("empruntsMois", (int) (Math.random() * 300) + 200);
        resume.put("retoursMois", (int) (Math.random() * 280) + 180);
        resume.put("reservationsMois", (int) (Math.random() * 100) + 50);
        resume.put("nouveauxLecteursMois", (int) (Math.random() * 20) + 10);
        
        // Tendances (simulées)
        resume.put("tendanceEmprunts", Math.random() > 0.5 ? "hausse" : "baisse");
        resume.put("pourcentageEvolution", Math.round((Math.random() * 20 - 10) * 100.0) / 100.0);
        
        return resume;
    }
}