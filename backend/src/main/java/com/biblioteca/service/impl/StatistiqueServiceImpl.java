package com.biblioteca.service.impl;

import com.biblioteca.entity.enums.StatutEmprunt;
import com.biblioteca.repository.CategorieRepository;
import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.repository.LivreRepository;
import com.biblioteca.service.StatistiqueService;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatistiqueServiceImpl implements StatistiqueService {
  private final LivreRepository livreRepository;
  private final EmpruntRepository empruntRepository;
  private final CategorieRepository categorieRepository;

  public StatistiqueServiceImpl(LivreRepository livreRepository,
                                EmpruntRepository empruntRepository,
                                CategorieRepository categorieRepository) {
    this.livreRepository = livreRepository;
    this.empruntRepository = empruntRepository;
    this.categorieRepository = categorieRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public long getNombreLivresTotal() {
    return livreRepository.count();
  }

  @Override
  @Transactional(readOnly = true)
  public long getNombreEmpruntsEnCours() {
    return empruntRepository.countByStatut(StatutEmprunt.EN_COURS);
  }

  @Override
  @Transactional(readOnly = true)
  public long getNombreRetards() {
    return empruntRepository.countByStatut(StatutEmprunt.EN_RETARD);
  }

  @Override
  @Transactional(readOnly = true)
  public Map<LocalDate, Long> getEmpruntsParJour(LocalDate debut, LocalDate fin) {
    List<Object[]> rows = empruntRepository.countByDateEmpruntBetweenGroupByDate(debut, fin);
    Map<LocalDate, Long> map = new LinkedHashMap<>();
    LocalDate cursor = debut;
    while (!cursor.isAfter(fin)) {
      map.put(cursor, 0L);
      cursor = cursor.plusDays(1);
    }
    for (Object[] row : rows) {
      map.put((LocalDate) row[0], (Long) row[1]);
    }
    return map;
  }

  @Override
  @Transactional(readOnly = true)
  public Map<String, Long> getRepartitionParCategorie() {
    List<Object[]> rows = livreRepository.countByCategorieGroupByNom();
    Map<String, Long> out = new LinkedHashMap<>();
    for (Object[] row : rows) {
      out.put((String) row[0], (Long) row[1]);
    }
    return out;
  }
}

