package com.biblioteca.service.impl;

import static com.biblioteca.repository.LivreSpecifications.actifOnly;
import static com.biblioteca.repository.LivreSpecifications.anneeMax;
import static com.biblioteca.repository.LivreSpecifications.anneeMin;
import static com.biblioteca.repository.LivreSpecifications.auteur;
import static com.biblioteca.repository.LivreSpecifications.categorieId;
import static com.biblioteca.repository.LivreSpecifications.dispo;
import static com.biblioteca.repository.LivreSpecifications.isbn;
import static com.biblioteca.repository.LivreSpecifications.langue;
import static com.biblioteca.repository.LivreSpecifications.textSearch;
import static com.biblioteca.repository.LivreSpecifications.titre;

import com.biblioteca.dto.ExemplaireCreateRequest;
import com.biblioteca.dto.LivreSaveRequest;
import com.biblioteca.entity.Categorie;
import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import com.biblioteca.entity.MouvementLivre;
import com.biblioteca.entity.enums.EtatExemplaire;
import com.biblioteca.exception.BusinessException;
import com.biblioteca.repository.CategorieRepository;
import com.biblioteca.repository.ExemplaireRepository;
import com.biblioteca.repository.LangueRepository;
import com.biblioteca.repository.LangueRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.repository.MouvementLivreRepository;
import com.biblioteca.repository.UtilisateurRepository;
import com.biblioteca.service.LivreService;
import com.biblioteca.service.NotificationService;
import com.biblioteca.util.FileStorageService;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LivreServiceImpl implements LivreService {

  private final LivreRepository livreRepository;
  private final CategorieRepository categorieRepository;
  private final ExemplaireRepository exemplaireRepository;
  private final MouvementLivreRepository mouvementLivreRepository;
  private final FileStorageService fileStorageService;
  private final UtilisateurRepository utilisateurRepository;
  private final NotificationService notificationService;
  private final LangueRepository langueRepository;

  public LivreServiceImpl(LivreRepository livreRepository,
                          CategorieRepository categorieRepository,
                          ExemplaireRepository exemplaireRepository,
                          MouvementLivreRepository mouvementLivreRepository,
                          FileStorageService fileStorageService,
                          UtilisateurRepository utilisateurRepository,
                          NotificationService notificationService,
                          LangueRepository langueRepository) {
    this.livreRepository = livreRepository;
    this.categorieRepository = categorieRepository;
    this.exemplaireRepository = exemplaireRepository;
    this.mouvementLivreRepository = mouvementLivreRepository;
    this.fileStorageService = fileStorageService;
    this.utilisateurRepository = utilisateurRepository;
    this.notificationService = notificationService;
    this.langueRepository = langueRepository;
  }

  @Override
  @Transactional
  public Livre ajouterLivre(LivreSaveRequest dto, MultipartFile couverture) {
    if (livreRepository.existsByIsbn(dto.isbn())) {
      throw new BusinessException("ISBN deja utilise");
    }
    Categorie cat = categorieRepository.findById(dto.categorieId())
        .orElseThrow(() -> new BusinessException("Categorie introuvable"));

    List<com.biblioteca.entity.Langue> langues = new java.util.ArrayList<>();
    if (dto.langueIds() != null && !dto.langueIds().isEmpty()) {
      langues = langueRepository.findAllById(dto.langueIds());
    }

    String url = store(couverture);
    Livre livre = Livre.builder()
        .titre(dto.titre())
        .isbn(dto.isbn())
        .auteur(dto.auteur())
        .editeur(dto.editeur())
        .edition(dto.edition())
        .anneePublication(dto.anneePublication())
        .categorie(cat)
        .langues(langues)
        .description(dto.description())
        .nombrePages(dto.nombrePages())
        .couverture(url)
        .actif(true)
        .build();
    Livre saved = livreRepository.save(livre);

    int nbEx = dto.nombreExemplaires() != null && dto.nombreExemplaires() > 0 ? dto.nombreExemplaires() : 1;
    for (int i = 1; i <= nbEx; i++) {
      String code = saved.getIsbn() + "-EX" + String.format("%02d", i);
      exemplaireRepository.save(Exemplaire.builder()
          .livre(saved)
          .codeExemplaire(code)
          .etat(EtatExemplaire.BON)
          .disponible(true)
          .build());
    }
    // Notifier les abonnés aux nouveaux livres
    String categorieName = cat.getNom();
    utilisateurRepository.findByNotifEmailNouveauLivreTrue().forEach(u ->
        notificationService.envoyerEmailNouveauLivre(u, saved.getTitre(), saved.getAuteur(), categorieName)
    );
    return saved;
  }

  @Override
  @Transactional
  public Livre modifierLivre(Long id, LivreSaveRequest dto, MultipartFile couverture) {
    Livre livre = getLivre(id);
    if (!livre.getIsbn().equals(dto.isbn()) && livreRepository.existsByIsbn(dto.isbn())) {
      throw new BusinessException("ISBN deja utilise");
    }
    Categorie cat = categorieRepository.findById(dto.categorieId())
        .orElseThrow(() -> new BusinessException("Categorie introuvable"));

    if (dto.langueIds() != null) {
      livre.setLangues(langueRepository.findAllById(dto.langueIds()));
    }

    String url = store(couverture);
    livre.setTitre(dto.titre());
    livre.setIsbn(dto.isbn());
    livre.setAuteur(dto.auteur());
    livre.setEditeur(dto.editeur());
    livre.setEdition(dto.edition());
    livre.setAnneePublication(dto.anneePublication());
    livre.setCategorie(cat);
    livre.setDescription(dto.description());
    if (url != null) {
      livre.setCouverture(url);
    }
    return livreRepository.save(livre);
  }

  @Override
  @Transactional
  public void desactiverLivre(Long id) {
    Livre livre = getLivre(id);
    livre.setActif(false);
    livreRepository.save(livre);
  }

  @Override
  @Transactional(readOnly = true)
  public Livre getLivre(Long id) {
    return livreRepository.findById(id).orElseThrow(() -> new BusinessException("Livre introuvable"));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Livre> rechercherLivres(String q, String t, String a, String i, Long catId, String lang,
                                     Integer min, Integer max, Boolean d, int page, int size) {
    Specification<Livre> spec = Specification.where(actifOnly(true))
        .and(textSearch(q))
        .and(titre(t))
        .and(auteur(a))
        .and(isbn(i))
        .and(categorieId(catId))
        .and(langue(lang))
        .and(anneeMin(min))
        .and(anneeMax(max))
        .and(dispo(d));

    PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateAjout"));
    return livreRepository.findAll(spec, pr);
  }

  @Override
  @Transactional(readOnly = true)
  public long obtenirNombreExemplairesDisponibles(Long livreId) {
    return exemplaireRepository.countByLivreIdAndDisponibleTrue(livreId);
  }

  @Override
  @Transactional(readOnly = true)
  public Exemplaire obtenirProchainExemplaireDisponible(Long livreId) {
    return exemplaireRepository.findFirstByLivreIdAndDisponibleTrueOrderByIdAsc(livreId)
        .orElseThrow(() -> new BusinessException("Aucun exemplaire disponible"));
  }

  @Override
  @Transactional(readOnly = true)
  public List<Exemplaire> listerExemplaires(Long livreId) {
    return exemplaireRepository.findByLivreIdOrderByIdAsc(livreId);
  }

  @Override
  @Transactional
  public Exemplaire ajouterExemplaire(Long livreId, ExemplaireCreateRequest req) {
    if (exemplaireRepository.existsByCodeExemplaire(req.codeExemplaire())) {
      throw new BusinessException("Code exemplaire deja utilise");
    }
    Livre livre = getLivre(livreId);
    Exemplaire ex = Exemplaire.builder()
        .livre(livre)
        .codeExemplaire(req.codeExemplaire())
        .etat(req.etat())
        .disponible(req.disponible() == null ? Boolean.TRUE : req.disponible())
        .localisation(req.localisation())
        .build();
    return exemplaireRepository.save(ex);
  }

  @Override
  @Transactional
  public Exemplaire modifierEtatExemplaire(Long exemplaireId, EtatExemplaire etat, Boolean disponible) {
    Exemplaire ex = exemplaireRepository.findById(exemplaireId)
        .orElseThrow(() -> new BusinessException("Exemplaire introuvable"));
    if (etat != null) ex.setEtat(etat);
    if (disponible != null) ex.setDisponible(disponible);
    return exemplaireRepository.save(ex);
  }

  @Override
  @Transactional(readOnly = true)
  public List<MouvementLivre> getHistoriqueMouvements(Long livreId, LocalDateTime debut, LocalDateTime fin) {
    return mouvementLivreRepository.findHistoriqueLivre(livreId, debut, fin);
  }

  private String store(MultipartFile couverture) {
    try {
      return fileStorageService.storeCouverture(couverture);
    } catch (IOException e) {
      throw new BusinessException("Echec upload couverture: " + e.getMessage());
    }
  }
}

