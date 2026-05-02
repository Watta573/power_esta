package com.biblioteca.service;

import com.biblioteca.entity.*;
import com.biblioteca.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class EtiquetteService {

    private final CodeBarresRepository codeBarresRepository;
    private final LivreRepository livreRepository;
    private final UtilisateurRepository utilisateurRepository;

    public EtiquetteService(
            CodeBarresRepository codeBarresRepository,
            LivreRepository livreRepository,
            UtilisateurRepository utilisateurRepository) {
        this.codeBarresRepository = codeBarresRepository;
        this.livreRepository = livreRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    // DTOs
    public record EtiquetteDataDto(
            String titre,
            String auteur,
            String cote,
            String isbn,
            String codeBarres,
            String nom,
            String prenom,
            String numeroLecteur,
            String rayonnage,
            String categorie
    ) {}

    public record CodeBarresDto(
            Long id,
            Long objetId,
            String objetType,
            String code,
            String typeCode,
            LocalDateTime dateCreation,
            Boolean actif
    ) {}

    /**
     * Génère un code-barres unique
     */
    public String genererCodeBarresUnique(String objetType) {
        String code;
        do {
            code = genererCodeAleatoire(objetType);
        } while (codeBarresRepository.existsByCodeAndActifTrue(code));
        
        return code;
    }

    /**
     * Crée un code-barres pour un objet
     */
    public CodeBarres creerCodeBarres(Long objetId, String objetType, String typeCode) {
        String code = genererCodeBarresUnique(objetType);
        
        CodeBarres codeBarres = CodeBarres.builder()
                .objetId(objetId)
                .objetType(objetType)
                .code(code)
                .typeCode(typeCode != null ? typeCode : "CODE128")
                .actif(true)
                .build();
        
        return codeBarresRepository.save(codeBarres);
    }

    /**
     * Obtient ou crée un code-barres pour un livre
     */
    public String obtenirCodeBarresLivre(Long livreId) {
        List<CodeBarres> codes = codeBarresRepository
                .findByObjetTypeAndObjetIdAndActifTrue("LIVRE", livreId);
        
        if (!codes.isEmpty()) {
            return codes.get(0).getCode();
        }
        
        CodeBarres nouveauCode = creerCodeBarres(livreId, "LIVRE", "CODE128");
        return nouveauCode.getCode();
    }

    /**
     * Obtient ou crée un code-barres pour un utilisateur
     */
    public String obtenirCodeBarresUtilisateur(Long utilisateurId) {
        List<CodeBarres> codes = codeBarresRepository
                .findByObjetTypeAndObjetIdAndActifTrue("UTILISATEUR", utilisateurId);
        
        if (!codes.isEmpty()) {
            return codes.get(0).getCode();
        }
        
        CodeBarres nouveauCode = creerCodeBarres(utilisateurId, "UTILISATEUR", "CODE128");
        return nouveauCode.getCode();
    }

    /**
     * Génère les données d'étiquettes pour une liste de livres
     */
    public List<EtiquetteDataDto> genererDonneesEtiquettesLivres(List<Long> livreIds) {
        return livreIds.stream()
                .map(this::genererDonneesEtiquetteLivre)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Génère les données d'étiquette pour un livre
     */
    public EtiquetteDataDto genererDonneesEtiquetteLivre(Long livreId) {
        Optional<Livre> livreOpt = livreRepository.findById(livreId);
        if (livreOpt.isEmpty()) {
            return null;
        }
        
        Livre livre = livreOpt.get();
        String codeBarres = obtenirCodeBarresLivre(livreId);
        
        return new EtiquetteDataDto(
                livre.getTitre(),
                livre.getAuteur(),
                genererCote(livre),
                livre.getIsbn(),
                codeBarres,
                null, null, null, null,
                livre.getCategorie() != null ? livre.getCategorie().getNom() : null
        );
    }

    /**
     * Génère les données d'étiquettes pour une liste d'utilisateurs
     */
    public List<EtiquetteDataDto> genererDonneesEtiquettesUtilisateurs(List<Long> utilisateurIds) {
        return utilisateurIds.stream()
                .map(this::genererDonneesEtiquetteUtilisateur)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Génère les données d'étiquette pour un utilisateur
     */
    public EtiquetteDataDto genererDonneesEtiquetteUtilisateur(Long utilisateurId) {
        Optional<Utilisateur> userOpt = utilisateurRepository.findById(utilisateurId);
        if (userOpt.isEmpty()) {
            return null;
        }
        
        Utilisateur user = userOpt.get();
        String codeBarres = obtenirCodeBarresUtilisateur(utilisateurId);
        
        return new EtiquetteDataDto(
                null, null, null, null, codeBarres,
                user.getNom(),
                user.getPrenom(),
                user.getIdentifiant(),
                null, null
        );
    }

    /**
     * Recherche un objet par son code-barres
     */
    public Optional<Map<String, Object>> rechercherParCodeBarres(String code) {
        return codeBarresRepository.findByCodeAndActifTrue(code)
                .map(codeBarres -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("codeBarres", toCodeBarresDto(codeBarres));
                    
                    // Charger l'objet associé
                    switch (codeBarres.getObjetType()) {
                        case "LIVRE":
                            livreRepository.findById(codeBarres.getObjetId())
                                    .ifPresent(livre -> result.put("objet", livre));
                            break;
                        case "UTILISATEUR":
                            utilisateurRepository.findById(codeBarres.getObjetId())
                                    .ifPresent(user -> result.put("objet", user));
                            break;
                    }
                    
                    return result;
                });
    }

    /**
     * Obtient tous les codes-barres d'un type
     */
    public List<CodeBarresDto> obtenirCodesBarresParType(String objetType) {
        return codeBarresRepository.findByObjetTypeAndActifTrueOrderByDateCreationDesc(objetType)
                .stream()
                .map(this::toCodeBarresDto)
                .collect(Collectors.toList());
    }

    // Méthodes utilitaires privées
    
    private String genererCodeAleatoire(String objetType) {
        String prefix = switch (objetType) {
            case "LIVRE" -> "L";
            case "UTILISATEUR" -> "U";
            case "EXEMPLAIRE" -> "E";
            default -> "X";
        };
        
        // Générer un code de 12 chiffres
        Random random = new Random();
        StringBuilder code = new StringBuilder(prefix);
        for (int i = 0; i < 11; i++) {
            code.append(random.nextInt(10));
        }
        
        return code.toString();
    }

    private String genererCote(Livre livre) {
        if (livre.getCategorie() == null) {
            return "GEN.000." + livre.getId();
        }
        
        String categorie = livre.getCategorie().getNom().toUpperCase();
        String prefix = switch (categorie) {
            case "INFORMATIQUE" -> "INFO";
            case "MATHÉMATIQUES", "MATHEMATIQUES" -> "MATH";
            case "PHYSIQUE" -> "PHYS";
            case "LITTÉRATURE", "LITTERATURE" -> "LITT";
            case "HISTOIRE" -> "HIST";
            case "DROIT" -> "DROI";
            case "ÉCONOMIE", "ECONOMIE" -> "ECON";
            case "MÉDECINE", "MEDECINE" -> "MEDE";
            default -> "GEN";
        };
        
        return prefix + "." + String.format("%03d", livre.getId() % 1000) + "." + 
               (livre.getAnneePublication() != null ? livre.getAnneePublication() : "0000");
    }

    private CodeBarresDto toCodeBarresDto(CodeBarres codeBarres) {
        return new CodeBarresDto(
                codeBarres.getId(),
                codeBarres.getObjetId(),
                codeBarres.getObjetType(),
                codeBarres.getCode(),
                codeBarres.getTypeCode(),
                codeBarres.getDateCreation(),
                codeBarres.getActif()
        );
    }
}