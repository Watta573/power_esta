package com.biblioteca.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(name = "commandes_achat")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CommandeAchat {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 180)
  private String fournisseur;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "fournisseur_id")
  private Fournisseur fournisseurEntity;

  @Column(name = "nb_titres", nullable = false)
  private Integer nbTitres;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal montant;

  @Column(name = "date_commande", nullable = false)
  private LocalDate dateCommande;

  @Column(name = "date_livraison")
  private LocalDate dateLivraison;

  @Column(nullable = false, length = 20)
  private String statut; // EN_COURS, LIVREE, ANNULEE

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  void prePersist() {
    if (dateCommande == null) dateCommande = LocalDate.now();
    if (statut == null) statut = "EN_COURS";
    if (nbTitres == null) nbTitres = 0;
    if (montant == null) montant = BigDecimal.ZERO;
  }
}
