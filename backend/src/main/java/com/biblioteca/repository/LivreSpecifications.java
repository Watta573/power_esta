package com.biblioteca.repository;

import com.biblioteca.entity.Exemplaire;
import com.biblioteca.entity.Livre;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

public final class LivreSpecifications {
  private LivreSpecifications() {
  }

  public static Specification<Livre> actifOnly(Boolean actif) {
    if (actif == null) return null;
    return (root, query, cb) -> cb.equal(root.get("actif"), actif);
  }

  public static Specification<Livre> textSearch(String q) {
    if (q == null || q.isBlank()) return null;
    String like = "%" + q.trim().toLowerCase() + "%";
    return (root, query, cb) -> cb.or(
        cb.like(cb.lower(root.get("titre")), like),
        cb.like(cb.lower(root.get("auteur")), like),
        cb.like(cb.lower(root.get("isbn")), like),
        cb.like(cb.lower(root.get("description")), like)
    );
  }

  public static Specification<Livre> categorieId(Long categorieId) {
    if (categorieId == null) return null;
    return (root, query, cb) -> cb.equal(root.get("categorie").get("id"), categorieId);
  }

  public static Specification<Livre> langue(String langue) {
    if (langue == null || langue.isBlank()) return null;
    return (root, query, cb) -> cb.equal(cb.lower(root.get("langue")), langue.trim().toLowerCase());
  }

  public static Specification<Livre> isbn(String isbn) {
    if (isbn == null || isbn.isBlank()) return null;
    return (root, query, cb) -> cb.equal(root.get("isbn"), isbn.trim());
  }

  public static Specification<Livre> auteur(String auteur) {
    if (auteur == null || auteur.isBlank()) return null;
    String like = "%" + auteur.trim().toLowerCase() + "%";
    return (root, query, cb) -> cb.like(cb.lower(root.get("auteur")), like);
  }

  public static Specification<Livre> titre(String titre) {
    if (titre == null || titre.isBlank()) return null;
    String like = "%" + titre.trim().toLowerCase() + "%";
    return (root, query, cb) -> cb.like(cb.lower(root.get("titre")), like);
  }

  public static Specification<Livre> anneeMin(Integer min) {
    if (min == null) return null;
    return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("anneePublication"), min);
  }

  public static Specification<Livre> anneeMax(Integer max) {
    if (max == null) return null;
    return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("anneePublication"), max);
  }

  public static Specification<Livre> dispo(Boolean dispo) {
    if (dispo == null) return null;
    return (root, query, cb) -> {
      query.distinct(true);
      Subquery<Long> sq = query.subquery(Long.class);
      var ex = sq.from(Exemplaire.class);
      sq.select(cb.count(ex.get("id")));
      sq.where(
          cb.equal(ex.get("livre").get("id"), root.get("id")),
          cb.isTrue(ex.get("disponible"))
      );
      return dispo ? cb.greaterThan(sq, 0L) : cb.equal(sq, 0L);
    };
  }

  public static Specification<Livre> build(String q, String categorie, Long categorieId, String auteur,
      String langue, Integer anneeMin, Integer anneeMax, Boolean disponibleSeulement,
      ExemplaireRepository exemplaireRepository) {
    return Specification.where(textSearch(q))
        .and(categorieId(categorieId))
        .and(auteur(auteur))
        .and(langue(langue))
        .and(anneeMin(anneeMin))
        .and(anneeMax(anneeMax))
        .and(dispo(disponibleSeulement));
  }
}

