package com.biblioteca.dto.api;

import java.util.List;

public record DashboardStatsDto(
    long totalLivres,
    long exemplairesDisponibles,
    long empruntsEnCours,
    long retardsEnCours,
    long reservationsEnAttente,
    long empruntsAujourdhui,
    double amendeTotal,
    List<TopLivreDto> topLivres,
    List<EmpruntsParJourDto> empruntsParJour,
    List<RepartitionCategorieDto> repartitionCategories
) {
  public record TopLivreDto(LivreDto livre, long nbEmprunts) {}
  public record EmpruntsParJourDto(String date, long count) {}
  public record RepartitionCategorieDto(String categorie, long count) {}
}

