import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Emprunt, Livre, Reservation, Utilisateur } from "@/types";
import type { Cotisation } from "@/api/cotisations.api";

const LOGO_COLOR: [number, number, number] = [27, 67, 50];
const ACCENT_COLOR: [number, number, number] = [233, 196, 106];

function horodatage(): string {
  return new Date().toLocaleString("fr-FR", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function nomFichierDate(base: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function entete(doc: jsPDF, titre: string, exporteur: Utilisateur | null) {
  // Bandeau header
  doc.setFillColor(...LOGO_COLOR);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Bibliothèque ESTA", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Système de gestion de bibliothèque universitaire", 14, 19);

  // Titre du document
  doc.setFillColor(245, 245, 240);
  doc.rect(0, 28, 210, 14, "F");
  doc.setTextColor(...LOGO_COLOR);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(titre, 14, 38);

  // Ligne accent
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 42, 210, 1.5, "F");

  // Métadonnées export
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Exporté le : ${horodatage()}`, 14, 50);
  if (exporteur) {
    doc.text(
      `Exporté par : ${exporteur.prenom} ${exporteur.nom} — ${exporteur.role} (${exporteur.email})`,
      14, 56
    );
  }

  doc.setTextColor(0, 0, 0);
  return 62; // Y de départ pour le contenu
}

function pied(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 240);
    doc.rect(0, 285, 210, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Bibliothèque ESTA — Document généré automatiquement — Confidentiel", 14, 291);
    doc.text(`Page ${i} / ${pageCount}`, 185, 291);
  }
}

// ─── Export tableau générique ─────────────────────────────────────────────

export function exporterPDF(
  titre: string,
  colonnes: string[],
  donnees: Array<Array<string | number>>,
  nomFichier: string,
  exporteur: Utilisateur | null
) {
  const doc = new jsPDF();
  const startY = entete(doc, titre, exporteur);

  autoTable(doc, {
    head: [colonnes],
    body: donnees as string[][],
    startY,
    theme: "striped",
    headStyles: { fillColor: LOGO_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  pied(doc);
  doc.save(`${nomFichierDate(nomFichier)}.pdf`);
}

// ─── Reçu Emprunt ─────────────────────────────────────────────────────────

export function imprimerRecuEmprunt(emprunt: Emprunt, exporteur: Utilisateur | null) {
  const doc = new jsPDF();
  const startY = entete(doc, "REÇU D'EMPRUNT", exporteur);

  // Numéro de reçu
  doc.setFillColor(...LOGO_COLOR);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.roundedRect(140, startY - 10, 56, 10, 2, 2, "F");
  doc.text(`N° EMP-${String(emprunt.id).padStart(6, "0")}`, 168, startY - 3, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = startY + 4;

  // Section adhérent
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LOGO_COLOR);
  doc.text("INFORMATIONS ADHÉRENT", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`Nom : ${emprunt.utilisateur.prenom} ${emprunt.utilisateur.nom}`, 18, y + 14);
  doc.text(`Identifiant : ${emprunt.utilisateur.identifiant}`, 18, y + 20);
  doc.text(`Email : ${emprunt.utilisateur.email}`, 100, y + 14);
  doc.text(`Rôle : ${emprunt.utilisateur.role}`, 100, y + 20);
  y += 34;

  // Section document
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("DOCUMENT EMPRUNTÉ", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Titre : ${emprunt.livre.titre}`, 18, y + 14);
  doc.text(`Auteur : ${emprunt.livre.auteur}`, 18, y + 20);
  doc.text(`ISBN : ${emprunt.livre.isbn}`, 100, y + 14);
  doc.text(`Code exemplaire : ${emprunt.exemplaire.codeExemplaire}`, 100, y + 20);
  y += 34;

  // Section dates
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y, 182, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text("DÉTAILS DE L'EMPRUNT", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Date d'emprunt : ${emprunt.dateEmprunt}`, 18, y + 14);
  doc.text(`Date de retour prévue : ${emprunt.dateRetourPrevue}`, 18, y + 20);
  doc.text(`Renouvellements : ${emprunt.nombreRenouvellements}`, 100, y + 14);
  doc.text(`Statut : ${emprunt.statut}`, 100, y + 20);
  y += 34;

  // Amende si applicable
  if (emprunt.amende > 0) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, y, 182, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text(`⚠ Amende : ${emprunt.amende.toLocaleString("fr-FR")} FCFA`, 18, y + 10);
    y += 22;
  }

  // Signature
  y += 10;
  doc.setDrawColor(...LOGO_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, y, 90, y);
  doc.line(120, y, 196, y);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Signature de l'adhérent", 14, y + 5);
  doc.text("Cachet de la bibliothèque", 120, y + 5);

  pied(doc);
  doc.save(`${nomFichierDate(`recu_emprunt_${emprunt.id}`)}.pdf`);
}

// ─── Reçu Réservation ─────────────────────────────────────────────────────

export function imprimerRecuReservation(reservation: Reservation, exporteur: Utilisateur | null) {
  const doc = new jsPDF();
  const startY = entete(doc, "REÇU DE RÉSERVATION", exporteur);

  doc.setFillColor(...LOGO_COLOR);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.roundedRect(140, startY - 10, 56, 10, 2, 2, "F");
  doc.text(`N° RES-${String(reservation.id).padStart(6, "0")}`, 168, startY - 3, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = startY + 4;

  // Adhérent
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LOGO_COLOR);
  doc.text("INFORMATIONS ADHÉRENT", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Nom : ${reservation.utilisateur.prenom} ${reservation.utilisateur.nom}`, 18, y + 14);
  doc.text(`Identifiant : ${reservation.utilisateur.identifiant}`, 18, y + 20);
  doc.text(`Email : ${reservation.utilisateur.email}`, 100, y + 14);
  y += 34;

  // Document
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("DOCUMENT RÉSERVÉ", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Titre : ${reservation.livre.titre}`, 18, y + 14);
  doc.text(`Auteur : ${reservation.livre.auteur}`, 100, y + 14);
  y += 28;

  // Détails
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14, y, 182, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text("DÉTAILS DE LA RÉSERVATION", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Date de réservation : ${reservation.dateReservation}`, 18, y + 14);
  doc.text(`Date d'expiration : ${reservation.dateExpiration}`, 18, y + 20);
  doc.text(`Position en file : ${reservation.position}`, 100, y + 14);
  doc.text(`Statut : ${reservation.statut}`, 100, y + 20);
  y += 34;

  // Note
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("⚠ Vous avez 3 jours pour récupérer le document une fois disponible.", 14, y + 6);

  pied(doc);
  doc.save(`${nomFichierDate(`recu_reservation_${reservation.id}`)}.pdf`);
}

// ─── Reçu Cotisation ──────────────────────────────────────────────────────

export function imprimerRecuCotisation(cotisation: Cotisation, exporteur: Utilisateur | null) {
  const doc = new jsPDF();
  const startY = entete(doc, "REÇU DE COTISATION", exporteur);

  // Numéro de reçu
  doc.setFillColor(...LOGO_COLOR);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.roundedRect(140, startY - 10, 56, 10, 2, 2, "F");
  doc.text(`N° COT-${String(cotisation.id).padStart(6, "0")}`, 168, startY - 3, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = startY + 4;

  // Section adhérent
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LOGO_COLOR);
  doc.text("INFORMATIONS ADHÉRENT", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`Nom : ${cotisation.utilisateurNom}`, 18, y + 14);
  doc.text(`Email : ${cotisation.utilisateurEmail}`, 18, y + 20);
  y += 34;

  // Section cotisation
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 34, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("DÉTAILS DE LA COTISATION", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Montant : ${cotisation.montant.toLocaleString("fr-FR")} FCFA`, 18, y + 14);
  doc.text(`Période : du ${cotisation.dateDebut} au ${cotisation.dateFin}`, 18, y + 20);
  doc.text(`Date de paiement : ${cotisation.datePaiement}`, 18, y + 26);
  doc.text(`Statut : ${cotisation.statut}`, 100, y + 14);
  y += 40;

  // Notes si présentes
  if (cotisation.notes) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(14, y, 182, 22, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14);
    doc.text("NOTES", 18, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(cotisation.notes, 170);
    doc.text(lines.slice(0, 2), 18, y + 14);
    y += 28;
  }

  // Signature
  y += 10;
  doc.setDrawColor(...LOGO_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, y, 90, y);
  doc.line(120, y, 196, y);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Signature de l'adhérent", 14, y + 5);
  doc.text("Cachet de la bibliothèque", 120, y + 5);

  pied(doc);
  doc.save(`${nomFichierDate(`recu_cotisation_${cotisation.id}`)}.pdf`);
}

// ─── Reçu Abonnement ──────────────────────────────────────────────────────

export function imprimerRecuAbonnement(utilisateur: Utilisateur, exporteur: Utilisateur | null) {
  const doc = new jsPDF();
  const startY = entete(doc, "REÇU D'ABONNEMENT", exporteur);

  const now = new Date();
  const finAnnee = new Date(now.getFullYear(), 11, 31);

  doc.setTextColor(0, 0, 0);
  let y = startY + 4;

  // Adhérent
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 40, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LOGO_COLOR);
  doc.text("INFORMATIONS ADHÉRENT", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Nom complet : ${utilisateur.prenom} ${utilisateur.nom}`, 18, y + 14);
  doc.text(`Identifiant : ${utilisateur.identifiant}`, 18, y + 20);
  doc.text(`Email : ${utilisateur.email}`, 18, y + 26);
  doc.text(`Téléphone : ${utilisateur.telephone || "—"}`, 18, y + 32);
  doc.text(`Catégorie : ${utilisateur.role}`, 100, y + 14);
  doc.text(`Date d'inscription : ${utilisateur.dateInscription}`, 100, y + 20);
  doc.text(`Statut : ${utilisateur.actif ? "ACTIF" : "INACTIF"}`, 100, y + 26);
  y += 46;

  // Abonnement
  const quotas: Record<string, { quota: number; duree: number; tarif: number }> = {
    ETUDIANT: { quota: 3, duree: 14, tarif: 5000 },
    ENSEIGNANT: { quota: 5, duree: 21, tarif: 10000 },
    PUBLIC: { quota: 1, duree: 7, tarif: 3000 },
    BIBLIOTHECAIRE: { quota: 10, duree: 30, tarif: 0 },
    ADMIN: { quota: 10, duree: 30, tarif: 0 },
  };
  const info = quotas[utilisateur.role] ?? { quota: 3, duree: 14, tarif: 5000 };

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 40, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("DÉTAILS DE L'ABONNEMENT", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Début : ${now.toLocaleDateString("fr-FR")}`, 18, y + 14);
  doc.text(`Fin : ${finAnnee.toLocaleDateString("fr-FR")}`, 18, y + 20);
  doc.text(`Quota d'emprunts simultanés : ${info.quota} livre(s)`, 18, y + 26);
  doc.text(`Durée maximale par emprunt : ${info.duree} jours`, 18, y + 32);
  doc.text(`Emprunts en cours : ${utilisateur.nombreEmpruntsEnCours}`, 100, y + 14);
  doc.text(`Retards enregistrés : ${utilisateur.nombreRetards}`, 100, y + 20);
  y += 46;

  // Montant
  if (info.tarif > 0) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(14, y, 182, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(146, 64, 14);
    doc.text(`Montant de l'abonnement : ${info.tarif.toLocaleString("fr-FR")} FCFA`, 18, y + 10);
    y += 22;
  }

  // Signature
  y += 10;
  doc.setDrawColor(...LOGO_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, y, 90, y);
  doc.line(120, y, 196, y);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Signature de l'adhérent", 14, y + 5);
  doc.text("Cachet de la bibliothèque", 120, y + 5);

  pied(doc);
  doc.save(`${nomFichierDate(`recu_abonnement_${utilisateur.id}`)}.pdf`);
}

// ─── Fiche Livre ──────────────────────────────────────────────────────────

export function imprimerFicheLivre(livre: Livre, exporteur: Utilisateur | null) {
  const doc = new jsPDF();
  const startY = entete(doc, "FICHE LIVRE", exporteur);

  doc.setFillColor(...LOGO_COLOR);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.roundedRect(140, startY - 10, 56, 10, 2, 2, "F");
  doc.text(`ISBN : ${livre.isbn ?? "—"}`, 168, startY - 3, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = startY + 4;

  // Informations bibliographiques
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 46, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("INFORMATIONS BIBLIOGRAPHIQUES", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Titre : ${livre.titre}`, 18, y + 14);
  doc.text(`Auteur : ${livre.auteur}`, 18, y + 20);
  doc.text(`Éditeur : ${livre.editeur || "—"}`, 18, y + 26);
  doc.text(`Édition : ${livre.edition || "—"}`, 18, y + 32);
  doc.text(`Année : ${livre.anneePublication ?? "—"}`, 100, y + 20);
  doc.text(`Langue : ${livre.langue || "—"}`, 100, y + 26);
  doc.text(`Catégorie : ${livre.categorie?.nom || "—"}`, 100, y + 32);
  y += 52;

  // Disponibilité
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...LOGO_COLOR);
  doc.text("DISPONIBILITÉ", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Exemplaires total : ${livre.nombreExemplaires}`, 18, y + 14);
  doc.text(`Disponibles : ${livre.nombreDisponibles}`, 100, y + 14);
  y += 28;

  if (livre.description) {
    doc.setFillColor(250, 250, 248);
    doc.roundedRect(14, y, 182, 28, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("DESCRIPTION", 18, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(livre.description, 170);
    doc.text(lines.slice(0, 2), 18, y + 14);
  }

  pied(doc);
  doc.save(`${nomFichierDate(`fiche_livre_${livre.id}`)}.pdf`);
}

// ─── Rapport Finances ─────────────────────────────────────────────────────

export function imprimerRapportFinances(
  amendesEnCours: Array<{ nom: string; livre: string; joursRetard: number; amende: number }>,
  totalEnCours: number,
  totalRecouvre: number,
  totalGeneral: number,
  exporteur: Utilisateur | null
) {
  const doc = new jsPDF();
  const startY = entete(doc, "RAPPORT FINANCIER", exporteur);
  let y = startY + 4;

  // Résumé
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 34, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("RÉSUMÉ FINANCIER", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Amendes en cours : ${totalEnCours.toLocaleString("fr-FR")} FCFA`, 18, y + 14);
  doc.text(`Amendes recouvrées : ${totalRecouvre.toLocaleString("fr-FR")} FCFA`, 18, y + 20);
  doc.text(`Total général : ${totalGeneral.toLocaleString("fr-FR")} FCFA`, 18, y + 26);
  y += 40;

  // Tableau des retards
  autoTable(doc, {
    head: [["Adhérent", "Livre", "Jours retard", "Amende (FCFA)"]],
    body: amendesEnCours.map((e) => [e.nom, e.livre, `${e.joursRetard}j`, e.amende.toLocaleString("fr-FR")]),
    startY: y,
    theme: "striped",
    headStyles: { fillColor: LOGO_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  pied(doc);
  doc.save(`${nomFichierDate("rapport_finances")}.pdf`);
}

// ─── Export tableau (alias pour compatibilité) ────────────────────────────

export { exporterPDF as exporterRapportPDF };
