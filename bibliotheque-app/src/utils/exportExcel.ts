import * as XLSX from "xlsx";
import type { Utilisateur } from "@/types";

function horodatage(): string {
  return new Date().toLocaleString("fr-FR", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function nomFichierDate(base: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exporterExcel(
  nomFeuille: string,
  colonnes: string[],
  lignes: Array<Array<string | number>>,
  nomFichier: string,
  exporteur: Utilisateur | null
) {
  // Lignes de métadonnées en haut
  const meta: Array<Array<string | number>> = [
    ["Bibliothèque ESTA — Système de gestion de bibliothèque"],
    [`Document : ${nomFeuille}`],
    [`Exporté le : ${horodatage()}`],
    exporteur
      ? [`Exporté par : ${exporteur.prenom} ${exporteur.nom} — ${exporteur.role} (${exporteur.email})`]
      : ["Exporté par : Système"],
    [], // ligne vide
    colonnes,
    ...lignes,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(meta);

  // Largeur des colonnes auto
  const colWidths = colonnes.map((_, i) => ({
    wch: Math.max(
      colonnes[i]?.length ?? 10,
      ...lignes.map((row) => String(row[i] ?? "").length)
    ) + 4,
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, nomFeuille.substring(0, 31));
  XLSX.writeFile(workbook, `${nomFichierDate(nomFichier)}.xlsx`);
}

// Alias pour compatibilité avec l'existant
export function exporterRapportExcel(
  nomFeuille: string,
  colonnes: string[],
  lignes: Array<Array<string | number>>,
  nomFichier: string,
  exporteur?: Utilisateur | null
) {
  exporterExcel(nomFeuille, colonnes, lignes, nomFichier, exporteur ?? null);
}
