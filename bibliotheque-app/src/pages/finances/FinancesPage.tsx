import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign, faTriangleExclamation, faFileLines, faFileArrowDown, faPrint, faCircleCheck, faPlus, faXmark, faUsers, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useEmprunts, usePayerAmende } from "@/hooks/useEmprunts";
import { useCotisations, useCotisationStats, useCreateCotisation, useAnnulerCotisation, useMyCotisations } from "@/hooks/useCotisations";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useQuery } from "@tanstack/react-query";
import { statistiquesApi } from "@/api/statistiques.api";
import { useAuthStore } from "@/stores/auth.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { exporterPDF, imprimerRapportFinances, imprimerRecuCotisation } from "@/utils/exportPDF";
import { exporterExcel } from "@/utils/exportExcel";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { useT } from "@/stores/i18n.store";

type Onglet = "amendes" | "cotisations" | "rapport";

const COTISATION_COLORS: Record<string, string> = {
  ACTIVE:  "bg-green-100 text-green-700",
  EXPIREE: "bg-gray-100 text-gray-600",
  ANNULEE: "bg-red-100 text-red-700",
};

export default function FinancesPage() {
  const t = useT();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const canManage   = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));

  const [onglet, setOnglet] = useState<Onglet>(() => canManage ? "amendes" : "cotisations");
  const [pageRetards, setPageRetards]         = useState(0);
  const [pageCotisations, setPageCotisations] = useState(0);
  const [pageRetournes]                       = useState(0);
  const [showCotisationForm, setShowCotisationForm] = useState(false);
  const [userSearch, setUserSearch]           = useState("");
  const [cotisationForm, setCotisationForm]   = useState({
    utilisateurId: "", montant: "", dateDebut: "", dateFin: "", notes: "",
  });

  const { data: retards,           isLoading: loadingRetards  } = useEmprunts({ statut: "EN_RETARD", page: pageRetards, size: 20 });
  const { data: retournesAvecAmende }                            = useEmprunts({ statut: "RETOURNE", page: pageRetournes, size: 20 });
  const { data: stats }                                          = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => statistiquesApi.getDashboard().then((r) => r.data),
  });

  // Staff : liste complète. Non-staff : uniquement ses propres cotisations
  const { data: cotisations, isLoading: loadingCotisations } = useCotisations({ page: pageCotisations, size: 15 }, canManage);
  const { data: myCotisations, isLoading: loadingMyCotisations } = useMyCotisations({ page: pageCotisations, size: 15 });
  const { data: cotisationStats } = useCotisationStats(canManage);
  const { data: utilisateurs }    = useUtilisateurs({ q: userSearch || undefined, size: 20 });

  const { pending, requestExport, confirm, cancel } = useExportConfirm();
  const payerAmendeMutation       = usePayerAmende();
  const creerCotisationMutation   = useCreateCotisation();
  const annulerCotisationMutation = useAnnulerCotisation();

  const totalAmendesEnCours    = (retards?.content ?? []).reduce((s, e) => s + e.amende, 0);
  const totalAmendesRecouvrées = (retournesAvecAmende?.content ?? []).filter((e) => e.amende > 0).reduce((s, e) => s + e.amende, 0);

  // Données à afficher selon le rôle
  const cotisationsData   = canManage ? cotisations : myCotisations;
  const loadingCotisData  = canManage ? loadingCotisations : loadingMyCotisations;

  function submitCotisation() {
    if (!cotisationForm.utilisateurId || !cotisationForm.montant || !cotisationForm.dateDebut || !cotisationForm.dateFin) return;
    creerCotisationMutation.mutate({
      utilisateurId: Number(cotisationForm.utilisateurId),
      montant: Number(cotisationForm.montant),
      dateDebut: cotisationForm.dateDebut,
      dateFin: cotisationForm.dateFin,
      notes: cotisationForm.notes || undefined,
    }, {
      onSuccess: () => {
        setShowCotisationForm(false);
        setCotisationForm({ utilisateurId: "", montant: "", dateDebut: "", dateFin: "", notes: "" });
      },
    });
  }

  function telechargerRecuCotisation(cotisation: any) {
    imprimerRecuCotisation(cotisation, utilisateur);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.finances.titreComplet}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => requestExport("pdf", t.finances.rapportFinancier, () => exporterPDF(
              t.finances.rapportFinancier,
              [t.finances.adherent, t.emprunts.livre, t.finances.retourPrevu, t.finances.joursRetard, t.finances.amendeFCFA],
              (retards?.content ?? []).map((e) => [
                `${e.utilisateur.prenom} ${e.utilisateur.nom}`, e.livre.titre, e.dateRetourPrevue, e.joursRetard, e.amende
              ]),
              "rapport-finances", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 14 }} /> PDF
          </button>
          <button
            onClick={() => requestExport("excel", t.finances.rapportFinancier, () => exporterExcel(
              t.finances.rapportFinancier,
              [t.finances.adherent, t.emprunts.livre, t.finances.retourPrevu, t.finances.joursRetard, t.finances.amendeFCFA],
              (retards?.content ?? []).map((e) => [
                `${e.utilisateur.prenom} ${e.utilisateur.nom}`, e.livre.titre, e.dateRetourPrevue, e.joursRetard, e.amende
              ]),
              "rapport-finances", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-success px-3 py-2 text-sm text-success hover:bg-success/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 14 }} /> Excel
          </button>
          <button
            onClick={() => requestExport("print", t.finances.rapportFinancier, () => imprimerRapportFinances(
              (retards?.content ?? []).map((e) => ({
                nom: `${e.utilisateur.prenom} ${e.utilisateur.nom}`,
                livre: e.livre.titre,
                joursRetard: e.joursRetard,
                amende: e.amende,
              })),
              totalAmendesEnCours, totalAmendesRecouvrées, stats?.amendeTotal ?? 0, utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-2 hover:bg-surface"
          >
            <FontAwesomeIcon icon={faPrint} style={{ fontSize: 14 }} /> {t.finances.imprimer}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.finances.amendesEnCours,    value: `${totalAmendesEnCours.toLocaleString("fr-FR")} FCFA`,    icon: faTriangleExclamation, color: "text-danger"   },
          { label: t.finances.amendesRecouvertes, value: `${totalAmendesRecouvrées.toLocaleString("fr-FR")} FCFA`, icon: faDollarSign,          color: "text-success"  },
          { label: t.finances.cotisationsActives, value: canManage ? (cotisationStats?.totalActives ?? "—") : (myCotisations?.totalElements ?? "—"), icon: faUsers, color: "text-blue-600" },
          { label: t.finances.totalAmendes,       value: stats?.amendeTotal ? `${stats.amendeTotal.toLocaleString("fr-FR")} FCFA` : "—", icon: faFileLines, color: "text-primary"  },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-2">{label}</p>
              <FontAwesomeIcon icon={icon} style={{ fontSize: 18 }} className={color} />
            </div>
            <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {([
          { id: "amendes",     label: t.finances.amendesEnCours },
          ...(canManage ? [
            { id: "cotisations", label: t.finances.cotisations    },
            { id: "rapport",     label: t.finances.rapport        },
          ] : [
            { id: "cotisations", label: "Mon abonnement" },
          ])
        ] as { id: Onglet; label: string }[]).map(({ id, label }) => (
          <button key={id} onClick={() => setOnglet(id as Onglet)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${onglet === id ? "border-primary text-primary" : "border-transparent text-text-2 hover:text-text-1"}`}>
            {label}
          </button>
        ))}
      </div>

      {onglet === "amendes" && (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>{[t.finances.adherent, t.emprunts.livre, t.finances.retourPrevu, t.finances.joursRetard, t.finances.amendeFCFA, t.finances.statut, t.finances.action].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingRetards ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.finances.chargement}</td></tr>
              ) : (retards?.content ?? []).length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.finances.aucuneAmende}</td></tr>
              ) : (retards?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
                    <p className="text-xs text-text-2">{e.utilisateur.email}</p>
                  </td>
                  <td className="px-4 py-3 text-text-2">{e.livre.titre}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-3 font-bold text-danger">{e.joursRetard}j</td>
                  <td className="px-4 py-3 font-semibold text-danger">{e.amende.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge statut={e.statut} /></td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <button
                        onClick={() => payerAmendeMutation.mutate(e.id)}
                        disabled={payerAmendeMutation.isPending}
                        className="flex items-center gap-1 rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 11 }} /> {t.finances.encaisser}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(retards?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-text-2">{retards?.totalElements} {t.finances.dossiers}</span>
              <div className="flex gap-2">
                <button onClick={() => setPageRetards((p) => Math.max(0, p - 1))} disabled={pageRetards === 0}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.finances.precedent}</button>
                <button onClick={() => setPageRetards((p) => p + 1)} disabled={pageRetards >= (retards?.totalPages ?? 1) - 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.finances.suivant}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {onglet === "cotisations" && (
        <div className="space-y-4">
          {canManage && (
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-text-2">{t.finances.actives} : <strong className="text-success">{cotisationStats?.totalActives ?? 0}</strong></span>
                <span className="text-text-2">{t.finances.expirees} : <strong className="text-warning">{cotisationStats?.totalExpirees ?? 0}</strong></span>
                <span className="text-text-2">{t.finances.montantTotal} : <strong className="text-primary">{(cotisationStats?.montantTotal ?? 0).toLocaleString("fr-FR")} FCFA</strong></span>
              </div>
              <button onClick={() => setShowCotisationForm(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light">
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13 }} /> {t.finances.nouvelleCotisation}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>{[t.finances.adherent, t.finances.email, t.finances.montantFCFA, t.finances.dateDebut, t.finances.dateFin, t.finances.statut, t.finances.action].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingCotisData ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.finances.chargement}</td></tr>
                ) : (cotisationsData?.content ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.finances.aucuneCotisation}</td></tr>
                ) : (cotisationsData?.content ?? []).map((c) => (
                  <tr key={c.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{c.utilisateurNom}</td>
                    <td className="px-4 py-3 text-xs text-text-2">{c.utilisateurEmail}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{c.montant.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3 text-text-2">{c.dateDebut}</td>
                    <td className="px-4 py-3 text-text-2">{c.dateFin}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COTISATION_COLORS[c.statut] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => telechargerRecuCotisation(c)}
                          className="flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10"
                        >
                          <FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} /> {t.finances.telechargerRecu}
                        </button>
                        {canManage && c.statut === "ACTIVE" && (
                          <button onClick={() => annulerCotisationMutation.mutate(c.id)}
                            disabled={annulerCotisationMutation.isPending}
                            className="text-xs text-danger hover:underline disabled:opacity-50">
                            {t.finances.annuler}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(cotisationsData?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm text-text-2">{cotisationsData?.totalElements} {t.finances.cotisations}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPageCotisations((p) => Math.max(0, p - 1))} disabled={pageCotisations === 0}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.finances.precedent}</button>
                  <button onClick={() => setPageCotisations((p) => p + 1)} disabled={pageCotisations >= (cotisationsData?.totalPages ?? 1) - 1}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.finances.suivant}</button>
                </div>
              </div>
            )}
          </div>

          {canManage && showCotisationForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="font-semibold">{t.finances.nouvelleCotisation}</h2>
                  <button onClick={() => setShowCotisationForm(false)} className="text-text-3 hover:text-text-1">
                    <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
                  </button>
                </div>
                <div className="space-y-4 p-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">{t.finances.adherentLabel}</label>
                    <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={t.finances.rechercherAdherent}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    <select value={cotisationForm.utilisateurId}
                      onChange={(e) => setCotisationForm((f) => ({ ...f, utilisateurId: e.target.value }))}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option value="">{t.finances.choisirAdherent}</option>
                      {(utilisateurs?.content ?? []).map((u) => (
                        <option key={u.id} value={u.id}>{u.prenom} {u.nom} — {u.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">{t.finances.montantLabel}</label>
                    <input type="number" min={0} value={cotisationForm.montant}
                      onChange={(e) => setCotisationForm((f) => ({ ...f, montant: e.target.value }))}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">{t.finances.dateDebutLabel}</label>
                      <input type="date" value={cotisationForm.dateDebut}
                        onChange={(e) => setCotisationForm((f) => ({ ...f, dateDebut: e.target.value }))}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">{t.finances.dateFinLabel}</label>
                      <input type="date" value={cotisationForm.dateFin}
                        onChange={(e) => setCotisationForm((f) => ({ ...f, dateFin: e.target.value }))}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">{t.finances.notes}</label>
                    <textarea rows={2} value={cotisationForm.notes}
                      onChange={(e) => setCotisationForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={submitCotisation} disabled={creerCotisationMutation.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-60">
                      {creerCotisationMutation.isPending ? t.finances.enregistrement : t.finances.enregistrer}
                    </button>
                    <button onClick={() => setShowCotisationForm(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
                      {t.finances.annuler}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {onglet === "rapport" && canManage && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">{t.finances.resumeFinancier}</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: t.finances.amendesEnCours,    montant: totalAmendesEnCours,    color: "text-danger"   },
                { label: t.finances.amendesRecouvertes, montant: totalAmendesRecouvrées, color: "text-success"  },
                { label: t.finances.cotisationsTotal,  montant: cotisationStats?.montantTotal ?? 0, color: "text-blue-600" },
                { label: t.finances.totalGeneral,      montant: stats?.amendeTotal ?? 0, color: "text-primary"  },
              ].map((r) => (
                <div key={r.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-2">{r.label}</span>
                  <span className={`font-semibold ${r.color}`}>{r.montant.toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">{t.finances.activiteJour}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-2">{t.finances.empruntsAujourdhui}</span>
                <span className="font-semibold">{stats?.empruntsAujourdhui ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-2">{t.finances.reservationsEnAttente}</span>
                <span className="font-semibold">{stats?.reservationsEnAttente ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-2">{t.finances.retardsActifs}</span>
                <span className="font-semibold text-danger">{stats?.retardsEnCours ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-2">{t.finances.cotisationsActivesLabel}</span>
                <span className="font-semibold text-blue-600">{cotisationStats?.totalActives ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <ExportConfirmModal
          type={pending.type}
          document={pending.document}
          exporteur={utilisateur}
          onConfirm={confirm}
          onClose={cancel}
        />
      )}
    </section>
  );
}
