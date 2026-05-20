import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faPlus, faArrowTrendUp, faCircleCheck, faXmark, faCircleExclamation, faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { SuggestionAchat, CommandeAchat } from "@/api/acquisitions.api";
import { useAuthStore } from "@/stores/auth.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { useT } from "@/stores/i18n.store";
import {
  useSuggestions, useCommandes, useAcquisitionStats,
  useCreerSuggestion, useChangerStatutSuggestion,
  useCreerCommande, useMarquerLivree, useAnnulerCommande,
} from "@/hooks/useAcquisitions";
import { useFournisseursList } from "@/hooks/useFournisseurs";
import { exporterPDF } from "@/utils/exportPDF";
import { exporterExcel } from "@/utils/exportExcel";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";

type Onglet = "suggestions" | "commandes" | "budget";

const COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  APPROUVE:   "bg-green-100 text-green-700",
  REJETE:     "bg-red-100 text-red-700",
  LIVREE:     "bg-green-100 text-green-700",
  EN_COURS:   "bg-blue-100 text-blue-700",
  ANNULEE:    "bg-gray-100 text-gray-600",
};

const suggestionSchema = z.object({
  titre:         z.string().min(1),
  auteur:        z.string().optional(),
  isbn:          z.string().optional(),
  justification: z.string().optional(),
});

const commandeSchema = z.object({
  fournisseur: z.string().min(1),
  nbTitres:    z.number().int().positive(),
  montant:     z.number().positive(),
  notes:       z.string().optional(),
});

type SuggestionForm = z.infer<typeof suggestionSchema>;
type CommandeForm   = z.infer<typeof commandeSchema>;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AcquisitionsPage() {
  const t = useT();
  const [onglet, setOnglet]           = useState<Onglet>("suggestions");
  const [pageSugg, setPageSugg]       = useState(0);
  const [pageCmd, setPageCmd]         = useState(0);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [showSuggForm, setShowSuggForm] = useState(false);
  const [showCmdForm, setShowCmdForm]   = useState(false);

  const utilisateur = useAuthStore((s) => s.utilisateur);
  const canManage   = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const { pending, requestExport, confirm, cancel } = useExportConfirm();

  const LABELS: Record<string, string> = {
    EN_ATTENTE: t.statuts.EN_ATTENTE,
    APPROUVE:   t.acquisitions.approuve,
    REJETE:     t.acquisitions.rejete,
    LIVREE:     t.statuts.RETOURNE,
    EN_COURS:   t.statuts.EN_COURS,
    ANNULEE:    t.statuts.ANNULEE,
  };

  const { data: suggestions, isLoading: loadingSugg } = useSuggestions({ page: pageSugg, size: 15, statut: filtreStatut || undefined });
  const { data: commandes,   isLoading: loadingCmd  } = useCommandes({ page: pageCmd, size: 15 }, onglet === "commandes" && canManage);
  const { data: stats } = useAcquisitionStats(true);

  const statutMutation     = useChangerStatutSuggestion();
  const livrerMutation     = useMarquerLivree();
  const annulerCmdMutation = useAnnulerCommande();
  const creerSuggMutation  = useCreerSuggestion();
  const creerCmdMutation   = useCreerCommande();
  const { data: fournisseursList } = useFournisseursList();

  const suggForm = useForm<SuggestionForm>({ resolver: zodResolver(suggestionSchema) });
  const cmdForm  = useForm<CommandeForm>({
    resolver: zodResolver(commandeSchema),
    defaultValues: { nbTitres: 1, montant: 0 },
  });

  const TABS = [
    { id: "suggestions", label: t.acquisitions.suggestions, icon: faArrowTrendUp },
    ...(canManage ? [
      { id: "commandes", label: t.acquisitions.commandes,      icon: faCartShopping },
      { id: "budget",    label: t.acquisitions.suiviBudgetaire, icon: faCircleCheck  },
    ] : []),
  ] as { id: Onglet; label: string; icon: any }[];

  return (
    <section className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t.acquisitions.titreAchats}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSuggForm(true)}
            className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5"
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} /> {t.acquisitions.suggererTitre}
          </button>
          <button
            onClick={() => requestExport("pdf", t.acquisitions.suggestionsPDF, () => exporterPDF(
              t.acquisitions.suggestionsPDF,
              [t.acquisitions.titre2, t.acquisitions.auteurLabel, t.acquisitions.isbnLabel, t.acquisitions.demandeur, t.acquisitions.date, t.acquisitions.statut],
              (suggestions?.content ?? []).map((s: SuggestionAchat) => [
                s.titre, s.auteur ?? "—", s.isbn ?? "—", s.demandeur, s.dateDemande?.substring(0, 10) ?? "", s.statut
              ]),
              "suggestions-achat", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 13 }} /> PDF
          </button>
          <button
            onClick={() => requestExport("excel", t.acquisitions.suggestionsPDF, () => exporterExcel(
              t.acquisitions.suggestions,
              [t.acquisitions.titre2, t.acquisitions.auteurLabel, t.acquisitions.isbnLabel, t.acquisitions.demandeur, t.acquisitions.date, t.acquisitions.statut],
              (suggestions?.content ?? []).map((s: SuggestionAchat) => [
                s.titre, s.auteur ?? "—", s.isbn ?? "—", s.demandeur, s.dateDemande?.substring(0, 10) ?? "", s.statut
              ]),
              "suggestions-achat", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-success px-3 py-2 text-sm text-success hover:bg-success/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 13 }} /> Excel
          </button>
          {canManage && (
            <button
              onClick={() => setShowCmdForm(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light"
            >
              <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: 14 }} /> {t.acquisitions.nouvelleCommande}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className={`grid gap-4 ${canManage ? "sm:grid-cols-3 xl:grid-cols-6" : "sm:grid-cols-3"}`}>
          {[
            { label: t.acquisitions.totalSuggestions, value: stats.totalSuggestions,                    color: "text-primary"   },
            { label: t.acquisitions.enAttente,         value: stats.enAttente,                           color: "text-warning"   },
            { label: t.acquisitions.approuvees,        value: stats.approuvees,                          color: "text-success"   },
            ...(canManage ? [
              { label: t.acquisitions.commandes,    value: stats.totalCommandes,                         color: "text-blue-600"  },
              { label: t.acquisitions.livreeFCFA,   value: stats.montantLivrees.toLocaleString("fr-FR"), color: "text-success"   },
              { label: t.acquisitions.enCoursFCFA,  value: stats.montantEnCours.toLocaleString("fr-FR"), color: "text-warning"   },
            ] : []),
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <p className="text-xs text-text-2">{label}</p>
              <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              onglet === id ? "border-primary text-primary" : "border-transparent text-text-2 hover:text-text-1"
            }`}>
            <FontAwesomeIcon icon={icon} style={{ fontSize: 13 }} />{label}
          </button>
        ))}
      </div>

      {/* Onglet Suggestions */}
      {onglet === "suggestions" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={filtreStatut}
              onChange={(e) => { setFiltreStatut(e.target.value); setPageSugg(0); }}
              className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">{t.acquisitions.tousStatuts}</option>
              <option value="EN_ATTENTE">{t.statuts.EN_ATTENTE}</option>
              <option value="APPROUVE">{t.acquisitions.approuve}</option>
              <option value="REJETE">{t.acquisitions.rejete}</option>
            </select>
            <span className="text-sm text-text-2">{suggestions?.totalElements ?? 0} {t.acquisitions.suggestions}</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {[t.acquisitions.titre2, t.acquisitions.auteurLabel, t.acquisitions.isbnLabel,
                    ...(canManage ? [t.acquisitions.demandeur] : []),
                    t.acquisitions.date, t.acquisitions.statut,
                    ...(canManage ? [t.acquisitions.actions] : []),
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingSugg ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.acquisitions.chargement}</td></tr>
                ) : (suggestions?.content ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.acquisitions.aucuneSuggestion}</td></tr>
                ) : (suggestions?.content ?? []).map((s: SuggestionAchat) => (
                  <tr key={s.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{s.titre}</td>
                    <td className="px-4 py-3 text-text-2">{s.auteur || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-2">{s.isbn || "—"}</td>
                    {canManage && <td className="px-4 py-3">{s.demandeur}</td>}
                    <td className="px-4 py-3 text-text-2 text-xs">{s.dateDemande?.substring(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[s.statut]}`}>
                        {LABELS[s.statut]}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => statutMutation.mutate({ id: s.id, statut: "APPROUVE" })}
                            disabled={statutMutation.isPending}
                            className="text-xs text-green-600 hover:underline disabled:opacity-50"
                          >
                            {t.acquisitions.approuver}
                          </button>
                          <button
                            onClick={() => statutMutation.mutate({ id: s.id, statut: "REJETE" })}
                            disabled={statutMutation.isPending}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            {t.acquisitions.rejeter}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {(suggestions?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm text-text-2">{t.pagination.page} {pageSugg + 1} / {suggestions?.totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPageSugg((p) => Math.max(0, p - 1))} disabled={pageSugg === 0}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.pagination.precedent}</button>
                  <button onClick={() => setPageSugg((p) => p + 1)} disabled={pageSugg >= (suggestions?.totalPages ?? 1) - 1}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.pagination.suivant}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onglet Commandes (staff uniquement) */}
      {onglet === "commandes" && canManage && (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>{[t.acquisitions.fournisseur, t.acquisitions.nbTitres, t.acquisitions.montantFCFA, t.acquisitions.dateCommande, t.acquisitions.dateLivraison, t.acquisitions.statut, t.acquisitions.actions].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingCmd ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.acquisitions.chargement}</td></tr>
              ) : (commandes?.content ?? []).length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{t.acquisitions.aucuneCommande}</td></tr>
              ) : (commandes?.content ?? []).map((c: CommandeAchat) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium">{c.fournisseur}</td>
                  <td className="px-4 py-3">{c.nbTitres}</td>
                  <td className="px-4 py-3 font-medium">{c.montant.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3 text-text-2">{c.dateCommande}</td>
                  <td className="px-4 py-3 text-text-2">{c.dateLivraison ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[c.statut]}`}>
                      {LABELS[c.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.statut === "EN_COURS" && (
                      <div className="flex gap-2">
                        <button onClick={() => livrerMutation.mutate(c.id)} disabled={livrerMutation.isPending}
                          className="text-xs text-green-600 hover:underline disabled:opacity-50">{t.acquisitions.marquerLivree}</button>
                        <button onClick={() => annulerCmdMutation.mutate(c.id)} disabled={annulerCmdMutation.isPending}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50">{t.acquisitions.annuler}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(commandes?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-text-2">{commandes?.totalElements} {t.acquisitions.commandes}</span>
              <div className="flex gap-2">
                <button onClick={() => setPageCmd((p) => Math.max(0, p - 1))} disabled={pageCmd === 0}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.pagination.precedent}</button>
                <button onClick={() => setPageCmd((p) => p + 1)} disabled={pageCmd >= (commandes?.totalPages ?? 1) - 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.pagination.suivant}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onglet Budget (staff uniquement) */}
      {onglet === "budget" && canManage && stats && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">{t.acquisitions.resumeDepenses}</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: t.acquisitions.commandesLivrees, montant: stats.montantLivrees,                          color: "text-success" },
                { label: t.acquisitions.commandesEnCours, montant: stats.montantEnCours,                          color: "text-warning" },
                { label: t.acquisitions.totalEngage,      montant: stats.montantLivrees + stats.montantEnCours,   color: "text-primary" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-2">{r.label}</span>
                  <span className={`font-semibold ${r.color}`}>{r.montant.toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">{t.acquisitions.suggestions}</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: t.acquisitions.totalSoumises,       value: stats.totalSuggestions,                                          color: "text-primary" },
                { label: t.acquisitions.enAttenteTraitement, value: stats.enAttente,                                                  color: "text-warning" },
                { label: t.acquisitions.approuvees,          value: stats.approuvees,                                                 color: "text-success" },
                { label: t.acquisitions.rejetees,            value: stats.totalSuggestions - stats.enAttente - stats.approuvees,      color: "text-danger"  },
              ].map((r) => (
                <div key={r.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-2">{r.label}</span>
                  <span className={`font-semibold ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal suggestion */}
      {showSuggForm && (
        <Modal title={t.acquisitions.suggererTitreModal} onClose={() => setShowSuggForm(false)}>
          <form onSubmit={suggForm.handleSubmit((v) => creerSuggMutation.mutate(v, {
            onSuccess: () => { setShowSuggForm(false); suggForm.reset(); }
          }))} className="space-y-4">
            {([
              { name: "titre"  as const, label: t.acquisitions.titreLabel,  placeholder: t.acquisitions.titrePlaceholder },
              { name: "auteur" as const, label: t.acquisitions.auteurLabel,  placeholder: t.acquisitions.auteurLabel },
              { name: "isbn"   as const, label: t.acquisitions.isbnLabel,    placeholder: "978-..." },
            ]).map(({ name, label, placeholder }) => (
              <div key={name} className="space-y-1">
                <label className="text-sm font-medium text-text-2">{label}</label>
                <input {...suggForm.register(name)} placeholder={placeholder}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                {suggForm.formState.errors[name] && (
                  <p className="flex items-center gap-1 text-xs text-danger">
                    <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: 11 }} />
                    {suggForm.formState.errors[name]?.message}
                  </p>
                )}
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-2">{t.acquisitions.justification}</label>
              <textarea {...suggForm.register("justification")} rows={3} placeholder={t.acquisitions.justificationPlaceholder}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creerSuggMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-60">
                {creerSuggMutation.isPending ? t.acquisitions.envoi : t.acquisitions.soumettre}
              </button>
              <button type="button" onClick={() => setShowSuggForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
                {t.actions.annuler}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal commande (staff uniquement) */}
      {showCmdForm && canManage && (
        <Modal title={t.acquisitions.nouvelleCommandeModal} onClose={() => setShowCmdForm(false)}>
          <form onSubmit={cmdForm.handleSubmit((v) => creerCmdMutation.mutate(v, {
            onSuccess: () => { setShowCmdForm(false); cmdForm.reset(); }
          }))} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-2">{t.acquisitions.fournisseurLabel}</label>
              {(fournisseursList ?? []).length > 0 ? (
                <select {...cmdForm.register("fournisseur")}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">-- Choisir un fournisseur --</option>
                  {(fournisseursList ?? []).map((f: any) => (
                    <option key={f.id} value={f.nom}>{f.nom}{f.contactNom ? ` — ${f.contactNom}` : ""}</option>
                  ))}
                </select>
              ) : (
                <input {...cmdForm.register("fournisseur")} placeholder={t.acquisitions.fournisseurPlaceholder}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              )}
              {cmdForm.formState.errors.fournisseur && (
                <p className="text-xs text-danger">{cmdForm.formState.errors.fournisseur.message}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-2">{t.acquisitions.nbTitresLabel}</label>
                <input {...cmdForm.register("nbTitres", { valueAsNumber: true })} type="number" min={1}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                {cmdForm.formState.errors.nbTitres && (
                  <p className="text-xs text-danger">{cmdForm.formState.errors.nbTitres.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-2">{t.acquisitions.montantLabel}</label>
                <input {...cmdForm.register("montant", { valueAsNumber: true })} type="number" min={0}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                {cmdForm.formState.errors.montant && (
                  <p className="text-xs text-danger">{cmdForm.formState.errors.montant.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-2">{t.acquisitions.notes}</label>
              <textarea {...cmdForm.register("notes")} rows={3} placeholder="Détails de la commande..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text-2">
              La commande sera créée avec le statut <strong>EN COURS</strong>. Vous pourrez la marquer comme livrée depuis l'onglet Commandes.
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creerCmdMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-60">
                <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: 13 }} />
                {creerCmdMutation.isPending ? t.acquisitions.creation : t.acquisitions.creerCommande}
              </button>
              <button type="button" onClick={() => setShowCmdForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
                {t.actions.annuler}
              </button>
            </div>
          </form>
        </Modal>
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
