import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faXmark, faChevronRight,
  faCircleCheck, faHourglassHalf, faTriangleExclamation,
  faDollarSign, faCalendarCheck, faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { abonnementsApi, type FormulaAbonnement, type DemandeEnAttente } from "@/api/abonnements.api";
import { useAuthStore } from "@/stores/auth.store";
import { useEmprunts } from "@/hooks/useEmprunts";
import StatusBadge from "@/components/shared/StatusBadge";

// ─── Barre de progression abonnement ─────────────────────────────────────

function ProgressionAbonnement({ joursRestants, dureeMois }: { joursRestants: number; dureeMois: number }) {
  const pct = Math.max(0, Math.min(100, (joursRestants / (dureeMois * 30)) * 100));
  const steps = [
    { label: "Actif", done: pct > 66 },
    { label: "Mi-parcours", done: pct > 33 },
    { label: "Expire bientôt", done: pct > 0 },
  ];
  const color = pct > 50 ? "text-success" : pct > 20 ? "text-warning" : "text-danger";
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-0.5">
          <span className={`text-[10px] font-medium ${s.done ? color : "text-text-3"}`}>{s.label}</span>
          {i < steps.length - 1 && (
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 8 }} className="text-border mx-0.5" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Modal souscription ───────────────────────────────────────────────────

function SouscrireModal({ formules, onClose }: { formules: FormulaAbonnement[]; onClose: () => void }) {
  const [selected, setSelected] = useState<FormulaAbonnement | null>(null);
  const queryClient = useQueryClient();

  const souscrireMutation = useMutation({
    mutationFn: (formulaId: number) => abonnementsApi.souscrire(formulaId),
    onSuccess: () => {
      toast.success("Demande soumise. Rendez-vous à la bibliothèque pour le paiement.");
      queryClient.invalidateQueries({ queryKey: ["mon-abonnement"] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de la souscription"),
  });

  const PLAN_COLORS: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    gold: "border-amber-300 bg-amber-50",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          className="relative px-6 pb-4 pt-5"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Abonnement</p>
              <h2 className="mt-0.5 text-lg font-bold text-white">Choisir une formule</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          {formules.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(selected?.id === f.id ? null : f)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                selected?.id === f.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : `${PLAN_COLORS[f.couleur] ?? "border-border bg-surface"} hover:border-primary/40`
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-1">{f.nom}</p>
                  <p className="text-xs text-text-3 mt-0.5">{f.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-2">
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 10 }} />
                      {f.dureeMois} mois
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faUsers} style={{ fontSize: 10 }} />
                      {f.maxEmpruntsSimultanes} emprunt{f.maxEmpruntsSimultanes > 1 ? "s" : ""} simultané{f.maxEmpruntsSimultanes > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xl font-bold text-text-1">{f.prix.toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-text-3">FCFA</p>
                  {f.couleur === "gold" && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Meilleure valeur
                    </span>
                  )}
                </div>
              </div>
              {selected?.id === f.id && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-text-2">
                    Prix / mois : <strong>{Math.round(f.prix / f.dureeMois).toLocaleString("fr-FR")} FCFA</strong>
                    {" · "}Catalogue complet · Réservations incluses
                  </p>
                </div>
              )}
            </button>
          ))}

          <p className="text-xs text-text-3 text-center pt-1">
            Paiement en présentiel à la bibliothèque · Reçu envoyé par email après validation
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-text-2 transition hover:bg-surface"
          >
            Annuler
          </button>
          <button
            onClick={() => selected && souscrireMutation.mutate(selected.id)}
            disabled={!selected || souscrireMutation.isPending}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
          >
            {souscrireMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Envoi...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 12 }} />
                Soumettre la demande
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────

export default function AbonnementPage() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const [tab, setTab] = useState<"amendes" | "abonnement" | "attente">("amendes");
  const [showModal, setShowModal] = useState(false);

  const { data: formules = [] } = useQuery({
    queryKey: ["formules-abonnement"],
    queryFn: () => abonnementsApi.getFormules().then((r) => r.data),
  });

  const { data: monAbonnement } = useQuery({
    queryKey: ["mon-abonnement"],
    queryFn: () => abonnementsApi.getMonAbonnement().then((r) => r.data),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: enAttente = [] } = useQuery({
    queryKey: ["abonnements-en-attente"],
    queryFn: () => abonnementsApi.getEnAttente().then((r) => r.data),
    enabled: canManage,
  });

  const { data: mesAmendes } = useEmprunts({ statut: "EN_RETARD", page: 0, size: 50 });

  const [codeRecherche, setCodeRecherche] = useState("");
  const [cotisationTrouvee, setCotisationTrouvee] = useState<import("@/api/abonnements.api").CotisationInfo | null>(null);
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [rechercheErreur, setRechercheErreur] = useState("");

  const notifierMutation = useMutation({
    mutationFn: (id: number) => abonnementsApi.notifier(id),
    onSuccess: () => {
      toast.success("Notification envoyée — l'utilisateur est informé de venir payer");
      queryClient.invalidateQueries({ queryKey: ["abonnements-en-attente"] });
    },
    onError: () => toast.error("Erreur lors de la notification"),
  });

  async function rechercherCode() {
    if (!codeRecherche.trim()) return;
    setRechercheLoading(true);
    setRechercheErreur("");
    setCotisationTrouvee(null);
    try {
      const res = await abonnementsApi.rechercherParCode(codeRecherche.trim().toUpperCase());
      setCotisationTrouvee(res.data);
    } catch (err: any) {
      setRechercheErreur(err?.response?.data?.message ?? "Code introuvable");
    } finally {
      setRechercheLoading(false);
    }
  }

  const validerMutation = useMutation({
    mutationFn: (id: number) => abonnementsApi.valider(id),
    onSuccess: () => {
      toast.success("Abonnement validé et reçu envoyé par email");
      queryClient.invalidateQueries({ queryKey: ["abonnements-en-attente"] });
      queryClient.invalidateQueries({ queryKey: ["mon-abonnement"] });
      queryClient.invalidateQueries({ queryKey: ["cotisations"] });
      queryClient.invalidateQueries({ queryKey: ["my-cotisations"] });
      setCotisationTrouvee(null);
      setCodeRecherche("");
    },
    onError: () => toast.error("Erreur lors de la validation"),
  });

  const rejeterMutation = useMutation({
    mutationFn: (id: number) => abonnementsApi.rejeter(id),
    onSuccess: () => {
      toast.success("Demande rejetée");
      queryClient.invalidateQueries({ queryKey: ["abonnements-en-attente"] });
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  const annulerDemandeMutation = useMutation({
    mutationFn: () => abonnementsApi.annulerDemande(),
    onSuccess: () => {
      toast.success("Demande annulée");
      queryClient.invalidateQueries({ queryKey: ["mon-abonnement"] });
      queryClient.invalidateQueries({ queryKey: ["abonnements-en-attente"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur"),
  });

  const aActif = monAbonnement?.actif === true;
  const aEnAttente = monAbonnement?.statut === "EN_ATTENTE";

  const TABS = [
    { key: "amendes",     label: "Amendes en cours" },
    { key: "abonnement",  label: "Mon abonnement" },
    ...(canManage ? [{ key: "attente", label: `Demandes en attente${(enAttente as DemandeEnAttente[]).length > 0 ? ` (${(enAttente as DemandeEnAttente[]).length})` : ""}` }] : []),
  ];

  return (
    <section className="space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Abonnement & Amendes</h1>
        {!aActif && !aEnAttente && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13 }} /> Souscrire un abonnement
          </button>
        )}
        {aEnAttente && (
          <span className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
            <FontAwesomeIcon icon={faHourglassHalf} style={{ fontSize: 13 }} />
            Demande en attente de validation
          </span>
        )}
        {aActif && (
          <span className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
            <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 13 }} />
            Abonnement actif — {monAbonnement?.joursRestants}j restants
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? "bg-primary text-white" : "text-text-2 hover:text-text-1"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Onglet Amendes ── */}
      {tab === "amendes" && (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                {["Adhérent", "Livre", "Retour prévu", "Retard", "Amende (FCFA)", "Statut"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(mesAmendes?.content ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-3">
                    <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 24 }} className="text-success mb-2 block mx-auto" />
                    Aucune amende en cours
                  </td>
                </tr>
              ) : (mesAmendes?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
                    <p className="text-xs text-text-2">{e.utilisateur.email}</p>
                  </td>
                  <td className="px-4 py-3 text-text-2 max-w-[180px] truncate">{e.livre?.titre ?? "—"}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-3 font-bold text-danger">{e.joursRetard}j</td>
                  <td className="px-4 py-3 font-semibold text-danger">{e.amende.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge statut={e.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Onglet Mon abonnement ── */}
      {tab === "abonnement" && (
        <div className="space-y-4">

          {/* Statut actuel */}
          {monAbonnement && (
            <div className={`rounded-xl border p-4 ${
              aActif ? "border-success/30 bg-success/5"
              : aEnAttente ? "border-warning/30 bg-warning/5"
              : "border-border bg-surface"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 ${
                  aActif ? "bg-success/10" : aEnAttente ? "bg-warning/10" : "bg-surface-2"
                }`}>
                  <FontAwesomeIcon
                    icon={aActif ? faCircleCheck : aEnAttente ? faHourglassHalf : faTriangleExclamation}
                    style={{ fontSize: 16 }}
                    className={aActif ? "text-success" : aEnAttente ? "text-warning" : "text-text-3"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {aActif ? (
                    <>
                      <p className="font-semibold text-text-1">
                        Formule {monAbonnement.formule} · expire le {monAbonnement.dateFin}
                      </p>
                      <div className="mt-1 space-y-1">
                        <ProgressionAbonnement joursRestants={monAbonnement.joursRestants} dureeMois={3} />
                        <div className="w-48 bg-border rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${monAbonnement.joursRestants > 30 ? "bg-success" : monAbonnement.joursRestants > 10 ? "bg-warning" : "bg-danger"}`}
                            style={{ width: `${Math.min(100, (monAbonnement.joursRestants / 90) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : aEnAttente ? (
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-text-1">
                        Demande en attente — Formule {monAbonnement.formule} · {monAbonnement.montant.toLocaleString("fr-FR")} FCFA
                      </p>
                      {!canManage && (
                        <button
                          onClick={() => annulerDemandeMutation.mutate()}
                          disabled={annulerDemandeMutation.isPending}
                          className="shrink-0 rounded border border-danger px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
                        >
                          Annuler ma demande
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-text-2">Aucun abonnement actif. Choisissez une formule pour accéder aux emprunts.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tableau comparatif des formules */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="font-semibold text-text-1">Formules disponibles</p>
              {!aActif && !aEnAttente && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light"
                >
                  <FontAwesomeIcon icon={faPlus} style={{ fontSize: 11 }} /> Souscrire
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {["Formule", "Durée", "Prix", "Emprunts max", "Prix / mois", "Réservations", "Catalogue"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(formules as FormulaAbonnement[]).map((f) => {
                  const isCurrent = aActif && monAbonnement?.formule === f.nom;
                  return (
                    <tr key={f.id} className={`hover:bg-surface ${isCurrent ? "bg-success/5" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-1">{f.nom}</span>
                          {isCurrent && (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Actif</span>
                          )}
                          {f.couleur === "gold" && !isCurrent && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Populaire</span>
                          )}
                        </div>
                        <p className="text-xs text-text-3">{f.description}</p>
                      </td>
                      <td className="px-4 py-3 text-text-2">{f.dureeMois} mois</td>
                      <td className="px-4 py-3 font-semibold text-text-1">{f.prix.toLocaleString("fr-FR")} FCFA</td>
                      <td className="px-4 py-3 text-text-2">{f.maxEmpruntsSimultanes}</td>
                      <td className="px-4 py-3 text-text-2">{Math.round(f.prix / f.dureeMois).toLocaleString("fr-FR")} FCFA</td>
                      <td className="px-4 py-3 text-success">✓</td>
                      <td className="px-4 py-3 text-success">✓</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border bg-surface">
              <p className="text-xs text-text-3">
                Paiement en présentiel à la bibliothèque · Un reçu vous sera envoyé par email après validation par le bibliothécaire
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet Demandes en attente (staff) ── */}
      {canManage && tab === "attente" && (
        <div className="space-y-6">

          {/* Étape 2 : Recherche par code barre */}
          <div className="rounded-xl border border-border bg-white shadow-sm p-5">
            <p className="font-semibold text-text-1 mb-1">Étape 2 — Saisir le code de réservation</p>
            <p className="text-xs text-text-3 mb-4">L'utilisateur présente son code reçu par email (ex : COT-482931)</p>
            <div className="flex gap-2">
              <input
                value={codeRecherche}
                onChange={(e) => setCodeRecherche(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && rechercherCode()}
                placeholder="COT-XXXXXX"
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
              />
              <button
                onClick={rechercherCode}
                disabled={rechercheLoading || !codeRecherche.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
              >
                {rechercheLoading ? "Recherche..." : "Rechercher"}
              </button>
            </div>
            {rechercheErreur && <p className="mt-2 text-xs text-danger">{rechercheErreur}</p>}

            {/* Infos utilisateur trouvé */}
            {cotisationTrouvee && (
              <div className="mt-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-3">Adhérent</p>
                    <p className="font-semibold text-text-1">{cotisationTrouvee.utilisateur}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Identifiant</p>
                    <p className="font-medium text-text-1">{cotisationTrouvee.identifiant}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Email</p>
                    <p className="text-text-2">{cotisationTrouvee.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Formule</p>
                    <p className="font-medium text-text-1">{cotisationTrouvee.formule}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Montant</p>
                    <p className="font-bold text-primary">{cotisationTrouvee.montant.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Période</p>
                    <p className="text-text-2">{cotisationTrouvee.dateDebut} → {cotisationTrouvee.dateFin}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-primary/20">
                  <button
                    onClick={() => validerMutation.mutate(cotisationTrouvee.id)}
                    disabled={validerMutation.isPending || cotisationTrouvee.statut === "ACTIVE"}
                    className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 13 }} />
                    {validerMutation.isPending ? "Validation..." : "Valider & Imprimer le reçu"}
                  </button>
                  <button
                    onClick={() => { setCotisationTrouvee(null); setCodeRecherche(""); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface"
                  >
                    Annuler
                  </button>
                </div>
                {cotisationTrouvee.statut === "ACTIVE" && (
                  <p className="text-xs text-success font-medium">✅ Cet abonnement est déjà actif</p>
                )}
              </div>
            )}
          </div>

          {/* Étape 1 : Liste des demandes en attente */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-semibold text-text-1">Étape 1 — Demandes en attente de notification</p>
              <p className="text-xs text-text-3 mt-0.5">Notifiez l'utilisateur de venir payer, il recevra son code par email</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {["Adhérent", "Email", "Formule", "Montant", "Période", "Code", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(enAttente as DemandeEnAttente[]).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-text-3">Aucune demande en attente</td></tr>
                ) : (enAttente as DemandeEnAttente[]).map((d) => (
                  <tr key={d.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium text-text-1">{d.utilisateur}</td>
                    <td className="px-4 py-3 text-text-2 text-xs">{d.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{d.formule}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-1">{d.montant.toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-4 py-3 text-text-2 text-xs">{d.dateDebut} → {d.dateFin}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-2">{(d as any).codeReservation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => notifierMutation.mutate(d.id)}
                          disabled={notifierMutation.isPending}
                          className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
                        >
                          Notifier
                        </button>
                        <button
                          onClick={() => rejeterMutation.mutate(d.id)}
                          disabled={rejeterMutation.isPending}
                          className="rounded border border-danger px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
                        >
                          Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal souscription */}
      <AnimatePresence>
        {showModal && (
          <SouscrireModal formules={formules as FormulaAbonnement[]} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}
