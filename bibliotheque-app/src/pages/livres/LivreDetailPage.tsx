import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { livresApi } from "@/api/livres.api";
import type { ExemplaireCreatePayload } from "@/api/livres.api";
import { empruntsApi } from "@/api/emprunts.api";
import { reservationsApi } from "@/api/reservations.api";
import { useAuthStore } from "@/stores/auth.store";
import StatusBadge from "@/components/shared/StatusBadge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faPencil, faPrint, faTrash, faPlus, faCheck, faXmark, faHistory } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useState } from "react";
import { couvertureUrl } from "@/lib/imageUrl";
import { imprimerFicheLivre } from "@/utils/exportPDF";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import type { EtatExemplaire, Exemplaire } from "@/types";
import { useT } from "@/stores/i18n.store";

const ETATS: EtatExemplaire[] = ["BON", "ABIME", "PERDU", "RETIRE"];

const ETAT_COLORS: Record<EtatExemplaire, string> = {
  BON: "text-success",
  ABIME: "text-warning",
  PERDU: "text-danger",
  RETIRE: "text-text-3",
};

export default function LivreDetailPage() {
  const t = useT();
  const tl = t.livreDetail;
  const { id } = useParams();
  const navigate = useNavigate();
  const livreId = Number(id);
  const queryClient = useQueryClient();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const canEdit = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const canDelete = useAuthStore((s) => s.hasRole(["ADMIN"]));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { pending, requestExport, confirm, cancel } = useExportConfirm();
  const [showAddExemplaire, setShowAddExemplaire] = useState(false);
  const [newEx, setNewEx] = useState<ExemplaireCreatePayload>({ codeExemplaire: "", etat: "BON", disponible: true, localisation: "" });
  const [editingEx, setEditingEx] = useState<Exemplaire | null>(null);
  const [showHistorique, setShowHistorique] = useState(false);
  const [histPage, setHistPage] = useState(0);

  const { data: livre, isLoading } = useQuery({
    queryKey: ["livre", livreId],
    queryFn: () => livresApi.getById(livreId).then((r) => r.data),
    enabled: Number.isFinite(livreId),
  });

  const { data: exemplaires } = useQuery({
    queryKey: ["exemplaires", livreId],
    queryFn: () => livresApi.getExemplaires(livreId).then((r) => r.data),
    enabled: canManage && Number.isFinite(livreId),
  });

  const empruntMutation = useMutation({
    mutationFn: (exemplaireId: number) =>
      empruntsApi.creer({ utilisateurId: utilisateur!.id, exemplaireId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livre", livreId] });
      queryClient.invalidateQueries({ queryKey: ["emprunts"] });
      toast.success("Emprunt enregistré !");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de l'emprunt"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => livresApi.delete(livreId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["livres"] });
      toast.success("Livre supprimé");
      navigate("/livres");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de la suppression"),
  });

  const reservationMutation = useMutation({
    mutationFn: () =>
      reservationsApi.creer({ utilisateurId: utilisateur!.id, livreId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Réservation créée !");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de la réservation"),
  });

  const addExemplaireMutation = useMutation({
    mutationFn: (data: ExemplaireCreatePayload) => livresApi.addExemplaire(livreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exemplaires", livreId] });
      queryClient.invalidateQueries({ queryKey: ["livre", livreId] });
      setShowAddExemplaire(false);
      setNewEx({ codeExemplaire: "", etat: "BON", disponible: true, localisation: "" });
      toast.success("Exemplaire ajouté");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de l'ajout"),
  });

  const updateExemplaireMutation = useMutation({
    mutationFn: ({ id, etat, disponible }: { id: number; etat: EtatExemplaire; disponible: boolean }) =>
      livresApi.updateExemplaire(livreId, id, etat, disponible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exemplaires", livreId] });
      queryClient.invalidateQueries({ queryKey: ["livre", livreId] });
      setEditingEx(null);
      toast.success("Exemplaire mis à jour");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur"),
  });

  const { data: historique, isLoading: loadingHist } = useQuery({
    queryKey: ["emprunts-livre", livreId, histPage],
    queryFn: () => empruntsApi.getByLivre(livreId, { page: histPage, size: 10 }).then((r) => r.data),
    enabled: canManage && showHistorique && Number.isFinite(livreId),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!livre) return <p className="text-text-2">Livre introuvable.</p>;

  const disponible = livre.nombreDisponibles > 0;
  const premierExemplaire = (exemplaires ?? []).find((e) => e.disponible);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-2 hover:text-text-1">
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 15 }} /> {tl.retourCatalogue}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => requestExport("print", `Fiche livre — ${livre.titre}`, () => imprimerFicheLivre(livre, utilisateur))}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-2 hover:bg-surface"
          >
            <FontAwesomeIcon icon={faPrint} style={{ fontSize: 14 }} /> {tl.imprimer}
          </button>
          {canEdit && (
            <button
              onClick={() => navigate(`/admin/livres/${livreId}/modifier`)}
              className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-sm text-primary hover:bg-primary/5"
            >
              <FontAwesomeIcon icon={faPencil} style={{ fontSize: 14 }} /> {tl.modifier}
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowHistorique((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                showHistorique ? "border-primary bg-primary/5 text-primary" : "border-border text-text-2 hover:bg-surface"
              }`}
            >
              <FontAwesomeIcon icon={faHistory} style={{ fontSize: 14 }} /> Historique
            </button>
          )}
          {canDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-danger">{tl.confirmerSuppression}</span>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg bg-danger px-3 py-1.5 text-sm text-white hover:bg-danger/90 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "..." : tl.ouiSupprimer}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">
                  {tl.annuler}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger/5"
              >
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} /> {tl.supprimer}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Couverture */}
        <div className="space-y-4">
          <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-surface-2">
            {livre.couverture ? (
              <img src={couvertureUrl(livre.couverture)!} alt={livre.titre} className="h-full w-full rounded-xl object-cover" />
            ) : (
              <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: 64 }} className="text-text-3" />
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {canManage ? (
              <button
                onClick={() => navigate(`/emprunts/nouveau?livreId=${livreId}`)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-light"
              >
                {tl.enregistrerEmprunt}
              </button>
            ) : disponible ? (
              <button
                onClick={() => premierExemplaire && empruntMutation.mutate(premierExemplaire.id)}
                disabled={empruntMutation.isPending || !premierExemplaire}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
              >
                {empruntMutation.isPending ? tl.enCours : tl.emprunter}
              </button>
            ) : (
              <button
                onClick={() => reservationMutation.mutate()}
                disabled={reservationMutation.isPending}
                className="w-full rounded-lg border border-primary py-2.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
              >
                {reservationMutation.isPending ? tl.enCours : tl.reserver}
              </button>
            )}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-surface p-2">
              <StatusBadge statut={disponible ? "DISPONIBLE" : "INDISPONIBLE"} label={disponible ? `${livre.nombreDisponibles} disponible(s)` : "Indisponible"} />
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="space-y-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              {livre.categorie && (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: livre.categorie.couleur + "20", color: livre.categorie.couleur }}>
                  {livre.categorie.nom}
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl font-bold">{livre.titre}</h1>
            <p className="mt-1 text-lg text-text-2">{livre.auteur}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: tl.isbn, value: livre.isbn },
              { label: tl.editeur, value: livre.editeur || "—" },
              { label: tl.edition, value: livre.edition || "—" },
              { label: tl.annee, value: livre.anneePublication?.toString() || "—" },
              { label: tl.langue, value: livre.langue || "—" },
              { label: tl.exemplairesTotal, value: livre.nombreExemplaires.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-surface p-3">
                <p className="text-xs text-text-3">{label}</p>
                <p className="mt-0.5 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          {livre.description && (
            <div>
              <h2 className="mb-2 font-semibold">{tl.description}</h2>
              <p className="text-sm leading-relaxed text-text-2">{livre.description}</p>
            </div>
          )}

          {/* Exemplaires (admin/biblio) */}
          {canManage && exemplaires && exemplaires.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold">{tl.exemplaires}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 text-text-2">
                    <tr>
                      {[tl.code, tl.etat, tl.localisation, tl.disponible, t.administration.actions].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {exemplaires.map((ex) => (
                      <tr key={ex.id} className="hover:bg-surface">
                        <td className="px-4 py-2.5 font-mono text-xs">{ex.codeExemplaire}</td>
                        {editingEx?.id === ex.id ? (
                          <>
                            <td className="px-4 py-2.5">
                              <select
                                value={editingEx.etat}
                                onChange={(e) => setEditingEx({ ...editingEx, etat: e.target.value as EtatExemplaire })}
                                className="rounded border border-border px-2 py-1 text-xs"
                              >
                                {ETATS.map((et) => <option key={et} value={et}>{et}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2.5 text-text-2">{ex.localisation || "—"}</td>
                            <td className="px-4 py-2.5">
                              <input
                                type="checkbox"
                                checked={editingEx.disponible}
                                onChange={(e) => setEditingEx({ ...editingEx, disponible: e.target.checked })}
                                className="h-4 w-4 accent-primary"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateExemplaireMutation.mutate({ id: ex.id, etat: editingEx.etat, disponible: editingEx.disponible })}
                                  disabled={updateExemplaireMutation.isPending}
                                  className="rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} />
                                </button>
                                <button
                                  onClick={() => setEditingEx(null)}
                                  className="rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface"
                                >
                                  <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className={`px-4 py-2.5 font-medium ${ETAT_COLORS[ex.etat]}`}>{ex.etat}</td>
                            <td className="px-4 py-2.5 text-text-2">{ex.localisation || "—"}</td>
                            <td className="px-4 py-2.5">
                              <StatusBadge statut={ex.disponible ? "DISPONIBLE" : "INDISPONIBLE"} label={ex.disponible ? "Oui" : "Non"} />
                            </td>
                            <td className="px-4 py-2.5">
                              <button
                                onClick={() => setEditingEx(ex)}
                                className="rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface-2 hover:text-primary"
                              >
                                <FontAwesomeIcon icon={faPencil} style={{ fontSize: 10 }} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ajout exemplaire */}
          {canManage && (
            <div>
              {!showAddExemplaire ? (
                <button
                  onClick={() => setShowAddExemplaire(true)}
                  className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5"
                >
                  <FontAwesomeIcon icon={faPlus} style={{ fontSize: 12 }} /> {tl.ajouterExemplaire}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); addExemplaireMutation.mutate(newEx); }}
                  className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3"
                >
                  <h3 className="font-semibold text-sm">{tl.nouvelExemplaire}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs text-text-2">{tl.codeExemplaire}</label>
                      <input
                        required
                        value={newEx.codeExemplaire}
                        onChange={(e) => setNewEx({ ...newEx, codeExemplaire: e.target.value })}
                        placeholder="ex: ISBN-EX03"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-2">{tl.etatLabel}</label>
                      <select
                        value={newEx.etat}
                        onChange={(e) => setNewEx({ ...newEx, etat: e.target.value as EtatExemplaire })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        {ETATS.map((et) => <option key={et} value={et}>{et}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-2">{tl.localisationLabel}</label>
                      <input
                        value={newEx.localisation ?? ""}
                        onChange={(e) => setNewEx({ ...newEx, localisation: e.target.value })}
                        placeholder="ex: Rayon A3"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="dispo-new"
                        checked={newEx.disponible ?? true}
                        onChange={(e) => setNewEx({ ...newEx, disponible: e.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      <label htmlFor="dispo-new" className="text-sm">{tl.disponibleImmediatement}</label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addExemplaireMutation.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-50"
                    >
                      {addExemplaireMutation.isPending ? tl.ajout : tl.ajouter}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddExemplaire(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface"
                    >
                      {tl.annuler}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      {pending && (
        <ExportConfirmModal
          type={pending.type}
          document={pending.document}
          exporteur={utilisateur}
          onConfirm={confirm}
          onClose={cancel}
        />
      )}

      {/* Historique complet des emprunts du livre */}
      {canManage && showHistorique && (
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-semibold">Historique des emprunts</h2>
              <p className="text-xs text-text-3">{historique?.totalElements ?? 0} emprunt(s) au total pour ce livre</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Taux de rotation */}
              {(historique?.totalElements ?? 0) > 0 && livre && (
                <div className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs">
                  <span className="text-text-3">Taux de rotation : </span>
                  <span className="font-bold text-primary">
                    {livre.nombreExemplaires > 0
                      ? ((historique!.totalElements / livre.nombreExemplaires)).toFixed(1)
                      : "—"} emprunts/exemplaire
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {["Adhérent", "Exemplaire", "Emprunté le", "Retour prévu", "Retour effectif", "Statut", "Amende"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingHist ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-text-3">Chargement...</td></tr>
                ) : (historique?.content ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-text-3">Aucun emprunt enregistré pour ce livre</td></tr>
                ) : (historique?.content ?? []).map((e) => (
                  <tr key={e.id} className="hover:bg-surface">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
                      <p className="text-xs text-text-3">{e.utilisateur.identifiant}</p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-text-2">{e.exemplaire?.codeExemplaire ?? "—"}</td>
                    <td className="px-4 py-2.5 text-text-2">{e.dateEmprunt}</td>
                    <td className="px-4 py-2.5 text-text-2">{e.dateRetourPrevue}</td>
                    <td className="px-4 py-2.5 text-text-2">{e.dateRetourEffective ?? <span className="text-text-3">—</span>}</td>
                    <td className="px-4 py-2.5"><StatusBadge statut={e.statut} /></td>
                    <td className="px-4 py-2.5">
                      {e.amende > 0
                        ? <span className="font-medium text-danger">{e.amende.toLocaleString("fr-FR")} FCFA</span>
                        : <span className="text-text-3">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(historique?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-text-2">Page {histPage + 1} / {historique?.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setHistPage((p) => Math.max(0, p - 1))} disabled={histPage === 0}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Précédent</button>
                <button onClick={() => setHistPage((p) => p + 1)} disabled={histPage >= (historique?.totalPages ?? 1) - 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Suivant</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
