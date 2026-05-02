export type Role = "ADMIN" | "BIBLIOTHECAIRE" | "ETUDIANT" | "ENSEIGNANT" | "PUBLIC";
export type StatutEmprunt = "EN_COURS" | "RETOURNE" | "EN_RETARD" | "PERDU";
export type EtatExemplaire = "BON" | "ABIME" | "PERDU" | "RETIRE";
export type StatutReservation = "EN_ATTENTE" | "DISPONIBLE" | "CONFIRMEE" | "ANNULEE" | "EXPIREE";
export type TypeNotification =
  | "RAPPEL_RETOUR"
  | "LIVRE_DISPONIBLE"
  | "RETARD_CONSTATE"
  | "AMENDE_GENEREE"
  | "COMPTE_CREE"
  | "EMPRUNT_CREE"
  | "RETOUR_CONFIRME"
  | "RESERVATION_CREEE"
  | "NOUVEAU_LIVRE"
  | "RESERVATION_EXPIREE";

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  identifiant: string;
  email: string;
  telephone: string;
  role: Role;
  actif: boolean;
  dateInscription: string;
  photo?: string;
  nombreEmpruntsEnCours: number;
  nombreRetards: number;
}

export interface Categorie {
  id: number;
  nom: string;
  couleur: string;
}

export interface Livre {
  id: number;
  titre: string;
  auteur: string;
  isbn: string;
  editeur: string;
  edition: string;
  anneePublication: number;
  categorie: Categorie;
  langue: string;
  description: string;
  couverture?: string;
  nombreExemplaires: number;
  nombreDisponibles: number;
  actif: boolean;
}

export interface Exemplaire {
  id: number;
  codeExemplaire: string;
  etat: EtatExemplaire;
  disponible: boolean;
  localisation: string;
}

export interface Emprunt {
  id: number;
  utilisateur: Utilisateur;
  exemplaire: Exemplaire;
  livre: Livre;
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourEffective?: string;
  statut: StatutEmprunt;
  nombreRenouvellements: number;
  amende: number;
  joursRetard: number;
}

export interface Reservation {
  id: number;
  utilisateur: Utilisateur;
  livre: Livre;
  dateReservation: string;
  dateExpiration: string;
  statut: StatutReservation;
  position: number;
}

export interface Notification {
  id: number;
  message: string;
  type: TypeNotification;
  dateEnvoi: string;
  lu: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  utilisateur: Utilisateur;
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  identifiant: string;
  motDePasse: string;
  role: Role;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface DashboardStats {
  totalLivres: number;
  exemplairesDisponibles: number;
  empruntsEnCours: number;
  retardsEnCours: number;
  reservationsEnAttente: number;
  empruntsAujourdhui: number;
  amendeTotal: number;
  topLivres: { livre: Livre; nbEmprunts: number }[];
  empruntsParJour: { date: string; count: number }[];
  repartitionCategories: { categorie: string; count: number }[];
}

