import { apiClient } from "./client";
import type { PageResponse } from "@/types";

// Types

export interface AvisLivre {
  id: number;
  utilisateur: { id: number; prenom: string; nom: string; identifiant: string };
  livre: { id: number; titre: string };
  note: number;
  commentaire?: string;
  dateAvis: string;
}

export interface WishlistItem {
  id: number;
  livre: { id: number; titre: string; auteur: string; couverture?: string; nombreDisponibles: number };
  dateAjout: string;
}

export interface AlerteThematique {
  id: number;
  typeAlerte: "CATEGORIE" | "AUTEUR";
  valeur: string;
  dateCreation: string;
}

export interface ListeLecture {
  id: number;
  enseignant: { id: number; prenom: string; nom: string };
  titre: string;
  description?: string;
  cours?: string;
  publique: boolean;
  dateCreation: string;
  livres: { id: number; titre: string; auteur: string; couverture?: string }[];
}

export interface CarteMembre {
  utilisateur: {
    id: number; nom: string; prenom: string; identifiant: string;
    email: string; role: string; dateInscription: string; actif: boolean;
  };
  stats: {
    empruntsEnCours: number; empruntsEnRetard: number; totalEmprunts: number;
    amendesDues: number; membreDepuis: string; anneeEnCours: number; empruntsAnneeEnCours: number;
  };
}

// Avis 

export const avisApi = {
  getByLivre: (livreId: number, page = 0, size = 10) =>
    apiClient.get<{ avis: PageResponse<AvisLivre>; moyenne: number; total: number }>(
      `/avis/livre/${livreId}`, { params: { page, size } }),

  getMonAvis: (utilisateurId: number, livreId: number) =>
    apiClient.get<{ avis?: AvisLivre; existe: boolean }>(
      `/avis/mon-avis`, { params: { utilisateurId, livreId } }),

  creerOuMettreAJour: (livreId: number, utilisateurId: number, note: number, commentaire?: string) =>
    apiClient.post<AvisLivre>(`/avis/livre/${livreId}`, { note, commentaire }, { params: { utilisateurId } }),

  supprimer: (livreId: number, utilisateurId: number) =>
    apiClient.delete(`/avis/livre/${livreId}`, { params: { utilisateurId } }),

  adminTous: (page = 0, size = 20) =>
    apiClient.get<PageResponse<AvisLivre>>(`/avis/admin/tous`, { params: { page, size } }),

  adminSupprimer: (id: number) =>
    apiClient.delete(`/avis/admin/${id}`),
};

// Wishlist 

export const wishlistApi = {
  getMaWishlist: (utilisateurId: number) =>
    apiClient.get<WishlistItem[]>(`/wishlist`, { params: { utilisateurId } }),

  check: (utilisateurId: number, livreId: number) =>
    apiClient.get<{ inWishlist: boolean }>(`/wishlist/check`, { params: { utilisateurId, livreId } }),

  ajouter: (livreId: number, utilisateurId: number) =>
    apiClient.post<{ status: string; inWishlist: boolean }>(`/wishlist/${livreId}`, null, { params: { utilisateurId } }),

  retirer: (livreId: number, utilisateurId: number) =>
    apiClient.delete<{ status: string; inWishlist: boolean }>(`/wishlist/${livreId}`, { params: { utilisateurId } }),
};

// Alertes thématiques

export const alertesApi = {
  getMesAlertes: (utilisateurId: number) =>
    apiClient.get<AlerteThematique[]>(`/alertes-thematiques`, { params: { utilisateurId } }),

  creer: (utilisateurId: number, typeAlerte: string, valeur: string) =>
    apiClient.post<AlerteThematique>(`/alertes-thematiques`, { typeAlerte, valeur }, { params: { utilisateurId } }),

  supprimer: (id: number, utilisateurId: number) =>
    apiClient.delete(`/alertes-thematiques/${id}`, { params: { utilisateurId } }),
};

// Listes de lecture

export const listesLectureApi = {
  getPubliques: (page = 0, size = 10) =>
    apiClient.get<PageResponse<ListeLecture>>(`/listes-lecture/publiques`, { params: { page, size } }),

  getMesListes: (enseignantId: number) =>
    apiClient.get<ListeLecture[]>(`/listes-lecture/mes-listes`, { params: { enseignantId } }),

  adminToutes: (page = 0, size = 20) =>
    apiClient.get<PageResponse<ListeLecture>>(`/listes-lecture/admin/toutes`, { params: { page, size } }),

  getById: (id: number) =>
    apiClient.get<ListeLecture>(`/listes-lecture/${id}`),

  creer: (enseignantId: number, payload: { titre: string; description?: string; cours?: string; publique: boolean }) =>
    apiClient.post<ListeLecture>(`/listes-lecture`, payload, { params: { enseignantId } }),

  modifier: (id: number, payload: { titre: string; description?: string; cours?: string; publique: boolean }) =>
    apiClient.put<ListeLecture>(`/listes-lecture/${id}`, payload),

  ajouterLivre: (id: number, livreId: number) =>
    apiClient.post<ListeLecture>(`/listes-lecture/${id}/livres/${livreId}`),

  retirerLivre: (id: number, livreId: number) =>
    apiClient.delete(`/listes-lecture/${id}/livres/${livreId}`),

  supprimer: (id: number) =>
    apiClient.delete(`/listes-lecture/${id}`),
};

export interface HistoriqueEmprunt {
  id: number;
  titre: string;
  auteur: string;
  codeExemplaire: string;
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourEffective?: string;
  statut: string;
  amende: number;
  nombreRenouvellements: number;
}

export interface AmendeDue {
  empruntId: number;
  titre: string;
  montant: number;
  joursRetard: number;
  dateRetourPrevue: string;
}

export interface StatistiquesPersonnelles {
  totalEmprunts: number;
  empruntsAnneeEnCours: number;
  empruntsParMois: Record<string, number>;
  topCategories: Record<string, number>;
  topAuteurs: Record<string, number>;
  nombreRetards: number;
}

// Espace membre

export const espaceMembreApi = {
  getCarte: (utilisateurId: number) =>
    apiClient.get<CarteMembre>(`/espace-membre/carte/${utilisateurId}`),

  getHistorique: (utilisateurId: number, page = 0, size = 10) =>
    apiClient.get<{ content: HistoriqueEmprunt[]; totalElements: number; totalPages: number; number: number; size: number }>(
      `/espace-membre/historique/${utilisateurId}`, { params: { page, size } }),

  getAmendes: (utilisateurId: number) =>
    apiClient.get<{ amendesEnCours: AmendeDue[]; totalDu: number; historiquePaiements: any[] }>(
      `/espace-membre/amendes/${utilisateurId}`),

  getStatistiques: (utilisateurId: number) =>
    apiClient.get<StatistiquesPersonnelles>(`/espace-membre/statistiques/${utilisateurId}`),
};
