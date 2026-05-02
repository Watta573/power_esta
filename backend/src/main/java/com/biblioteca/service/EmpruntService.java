package com.biblioteca.service;

import com.biblioteca.entity.Emprunt;
import java.math.BigDecimal;
import java.util.List;

public interface EmpruntService {
  Emprunt creerEmprunt(Long utilisateurId, Long exemplaireId);

  Emprunt enregistrerRetour(Long empruntId);

  Emprunt renouvelerEmprunt(Long empruntId);

  Emprunt payerAmende(Long empruntId);

  BigDecimal calculerAmende(Long empruntId);

  List<Emprunt> getEmpruntsEnRetard();

  List<Emprunt> getEmpruntsUtilisateur(Long utilisateurId);
}

