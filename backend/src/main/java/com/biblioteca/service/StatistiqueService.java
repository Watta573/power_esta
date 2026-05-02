package com.biblioteca.service;

import java.time.LocalDate;
import java.util.Map;

public interface StatistiqueService {
  long getNombreLivresTotal();

  long getNombreEmpruntsEnCours();

  long getNombreRetards();

  Map<LocalDate, Long> getEmpruntsParJour(LocalDate debut, LocalDate fin);

  Map<String, Long> getRepartitionParCategorie();
}

