import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  avisApi, wishlistApi, alertesApi, listesLectureApi, espaceMembreApi,
} from "@/api/espace-membre.api";

// ── Avis ───────────────────────────────────────────────────────────────────

export function useAvisLivre(livreId: number, page = 0) {
  return useQuery({
    queryKey: ["avis-livre", livreId, page],
    queryFn: () => avisApi.getByLivre(livreId, page).then((r) => r.data),
    enabled: !!livreId,
  });
}

export function useMonAvis(utilisateurId?: number, livreId?: number) {
  return useQuery({
    queryKey: ["mon-avis", utilisateurId, livreId],
    queryFn: () => avisApi.getMonAvis(utilisateurId!, livreId!).then((r) => r.data),
    enabled: !!utilisateurId && !!livreId,
  });
}

export function useSoumettreAvis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ livreId, utilisateurId, note, commentaire }: {
      livreId: number; utilisateurId: number; note: number; commentaire?: string;
    }) => avisApi.creerOuMettreAJour(livreId, utilisateurId, note, commentaire),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["avis-livre", v.livreId] });
      qc.invalidateQueries({ queryKey: ["mon-avis", v.utilisateurId, v.livreId] });
      toast.success("Avis enregistré !");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement de l'avis"),
  });
}

export function useSupprimerAvis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ livreId, utilisateurId }: { livreId: number; utilisateurId: number }) =>
      avisApi.supprimer(livreId, utilisateurId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["avis-livre", v.livreId] });
      qc.invalidateQueries({ queryKey: ["mon-avis", v.utilisateurId, v.livreId] });
      toast.success("Avis supprimé");
    },
  });
}

export function useAdminAvis(page = 0) {
  return useQuery({
    queryKey: ["admin-avis", page],
    queryFn: () => avisApi.adminTous(page).then((r) => r.data),
  });
}

export function useAdminSupprimerAvis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: avisApi.adminSupprimer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-avis"] });
      toast.success("Avis supprimé");
    },
  });
}

// ── Wishlist ───────────────────────────────────────────────────────────────

export function useWishlist(utilisateurId?: number) {
  return useQuery({
    queryKey: ["wishlist", utilisateurId],
    queryFn: () => wishlistApi.getMaWishlist(utilisateurId!).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useWishlistCheck(utilisateurId?: number, livreId?: number) {
  return useQuery({
    queryKey: ["wishlist-check", utilisateurId, livreId],
    queryFn: () => wishlistApi.check(utilisateurId!, livreId!).then((r) => r.data),
    enabled: !!utilisateurId && !!livreId,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ livreId, utilisateurId, inWishlist }: {
      livreId: number; utilisateurId: number; inWishlist: boolean;
    }) => inWishlist
      ? wishlistApi.retirer(livreId, utilisateurId)
      : wishlistApi.ajouter(livreId, utilisateurId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["wishlist", v.utilisateurId] });
      qc.invalidateQueries({ queryKey: ["wishlist-check", v.utilisateurId, v.livreId] });
      toast.success(v.inWishlist ? "Retiré de la liste de souhaits" : "Ajouté à la liste de souhaits");
    },
  });
}

// ── Alertes thématiques

export function useAlertes(utilisateurId?: number) {
  return useQuery({
    queryKey: ["alertes", utilisateurId],
    queryFn: () => alertesApi.getMesAlertes(utilisateurId!).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useCreerAlerte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ utilisateurId, typeAlerte, valeur }: {
      utilisateurId: number; typeAlerte: string; valeur: string;
    }) => alertesApi.creer(utilisateurId, typeAlerte, valeur),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["alertes", v.utilisateurId] });
      toast.success("Alerte créée !");
    },
    onError: () => toast.error("Cette alerte existe déjà"),
  });
}

export function useSupprimerAlerte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, utilisateurId }: { id: number; utilisateurId: number }) =>
      alertesApi.supprimer(id, utilisateurId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["alertes", v.utilisateurId] });
      toast.success("Alerte supprimée");
    },
  });
}

// Listes de lecture

export function useListesPubliques(page = 0) {
  return useQuery({
    queryKey: ["listes-publiques", page],
    queryFn: () => listesLectureApi.getPubliques(page).then((r) => r.data),
  });
}

export function useMesListes(enseignantId?: number) {
  return useQuery({
    queryKey: ["mes-listes", enseignantId],
    queryFn: () => listesLectureApi.getMesListes(enseignantId!).then((r) => r.data),
    enabled: !!enseignantId,
  });
}

export function useAdminListesLecture(page = 0) {
  return useQuery({
    queryKey: ["admin-listes", page],
    queryFn: () => listesLectureApi.adminToutes(page).then((r) => r.data),
  });
}

export function useListeDetail(id?: number) {
  return useQuery({
    queryKey: ["liste-detail", id],
    queryFn: () => listesLectureApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreerListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enseignantId, payload }: {
      enseignantId: number;
      payload: { titre: string; description?: string; cours?: string; publique: boolean };
    }) => listesLectureApi.creer(enseignantId, payload),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["mes-listes", v.enseignantId] });
      qc.invalidateQueries({ queryKey: ["listes-publiques"] });
      toast.success("Liste créée !");
    },
  });
}

export function useModifierListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number;
      payload: { titre: string; description?: string; cours?: string; publique: boolean };
    }) => listesLectureApi.modifier(id, payload),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["liste-detail", v.id] });
      qc.invalidateQueries({ queryKey: ["mes-listes"] });
      toast.success("Liste mise à jour");
    },
  });
}

export function useAjouterLivreListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, livreId }: { id: number; livreId: number }) =>
      listesLectureApi.ajouterLivre(id, livreId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["liste-detail", v.id] });
      toast.success("Livre ajouté à la liste");
    },
  });
}

export function useRetirerLivreListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, livreId }: { id: number; livreId: number }) =>
      listesLectureApi.retirerLivre(id, livreId),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["liste-detail", v.id] });
      toast.success("Livre retiré de la liste");
    },
  });
}

export function useSupprimerListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: listesLectureApi.supprimer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mes-listes"] });
      qc.invalidateQueries({ queryKey: ["listes-publiques"] });
      toast.success("Liste supprimée");
    },
  });
}

// ── Espace membre ──────────────────────────────────────────────────────────

export function useCarteMembre(utilisateurId?: number) {
  return useQuery({
    queryKey: ["carte-membre", utilisateurId],
    queryFn: () => espaceMembreApi.getCarte(utilisateurId!).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useHistoriqueEmprunts(utilisateurId?: number, page = 0) {
  return useQuery({
    queryKey: ["historique-emprunts", utilisateurId, page],
    queryFn: () => espaceMembreApi.getHistorique(utilisateurId!, page).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useAmendesUtilisateur(utilisateurId?: number) {
  return useQuery({
    queryKey: ["amendes-utilisateur", utilisateurId],
    queryFn: () => espaceMembreApi.getAmendes(utilisateurId!).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}

export function useStatistiquesPersonnelles(utilisateurId?: number) {
  return useQuery({
    queryKey: ["stats-personnelles", utilisateurId],
    queryFn: () => espaceMembreApi.getStatistiques(utilisateurId!).then((r) => r.data),
    enabled: !!utilisateurId,
  });
}
