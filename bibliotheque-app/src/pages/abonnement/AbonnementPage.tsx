import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faXmark, faChevronRight,
  faCircleCheck, faHourglassHalf, faTriangleExclamation,
  faCalendarCheck, faUsers, faEye, faDownload, faSearch, faRotateRight,
  faMobileScreen, faStore, faSpinner, faExternalLink,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { abonnementsApi, type FormulaAbonnement, type DemandeEnAttente, type CotisationListItem } from "@/api/abonnements.api";
import { useAuthStore } from "@/stores/auth.store";
import { useEmprunts } from "@/hooks/useEmprunts";
import StatusBadge from "@/components/shared/StatusBadge";
import Pagination from "@/components/shared/Pagination";

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

type ModePaiement = "PRESENTIEL" | "CINETPAY";

// Étape de suivi paiement CinetPay
function CinetPaySuivi({
  transactionId, onSuccess, onCancel,
}: { transactionId: string; onSuccess: () => void; onCancel: () => void }) {
  const [checking, setChecking] = useState(false);
  const [statut, setStatut] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling automatique toutes les 5s
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await abonnementsApi.verifierPaiement(transactionId);
        if (res.data.statut === "ACTIVE") {
          clearInterval(intervalRef.current!);
          setStatut("ACTIVE");
          onSuccess();
        }
      } catch { /* silencieux */ }
    }, 5000);
    return () => clearInterval(intervalRef.current!);
  }, [transactionId]);

  async function verifierManuellement() {
    setChecking(true);
    try {
      const res = await abonnementsApi.verifierPaiement(transactionId);
      setStatut(res.data.statut);
      if (res.data.statut === "ACTIVE") {
        clearInterval(intervalRef.current!);
        onSuccess();
      } else {
        toast.info("Paiement pas encore confirmé — " + (res.data.message ?? ""));
      }
    } catch {
      toast.error("Erreur lors de la vérification");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-center space-y-2">
        <FontAwesomeIcon icon={faMobileScreen} className="text-primary" style={{ fontSize: 32 }} />
        <p className="font-semibold text-text-1">Paiement Mobile Money en cours</p>
        <p className="text-xs text-text-3">Complétez le paiement dans la fenêtre CinetPay, puis revenez ici.</p>
        <div className="flex items-center justify-center gap-2 text-xs text-text-2">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ fontSize: 11 }} />
          Vérification automatique en cours...
        </div>
      </div>
      {statut === "ACTIVE" && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-center">
          <FontAwesomeIcon icon={faCircleCheck} className="text-success" style={{ fontSize: 20 }} />
          <p className="font-semibold text-success mt-1">Paiement confirmé ! Abonnement activé.</p>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={verifierManuellement}
          disabled={checking || statut === "ACTIVE"}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
        >
          {checking ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ fontSize: 12 }} /> : <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 12 }} />}
          Vérifier le paiement
        </button>
        <button
          onClick={onCancel}
          disabled={statut === "ACTIVE"}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function SouscrireModal({
  formules, onClose, renouveler = false,
}: {
  formules: FormulaAbonnement[];
  onClose: () => void;
  renouveler?: boolean;
}) {
  const [selected, setSelected] = useState<FormulaAbonnement | null>(null);
  const [mode, setMode] = useState<ModePaiement | null>(null);
  const [cinetpayUrl, setCinetpayUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const souscrireMutation = useMutation({
    mutationFn: (formulaId: number) =>
      renouveler ? abonnementsApi.renouveler(formulaId) : abonnementsApi.souscrire(formulaId),
    onSuccess: () => {
      toast.success("Demande soumise. Rendez-vous à la bibliothèque pour le paiement.");
      queryClient.invalidateQueries({ queryKey: ["mon-abonnement"] });
      queryClient.invalidateQueries({ queryKey: ["my-cotisations"] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de la souscription"),
  });

  const cinetpayMutation = useMutation({
    mutationFn: (formulaId: number) =>
      abonnementsApi.initierPaiementCinetPay(formulaId, renouveler),
    onSuccess: (res) => {
      setCinetpayUrl(res.data.paymentUrl);
      setTransactionId(res.data.transactionId);
      window.open(res.data.paymentUrl, "_blank", "noopener,noreferrer");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur CinetPay"),
  });

  function handleCinetPaySuccess() {
    toast.success("Paiement confirmé ! Votre abonnement est maintenant actif.");
    queryClient.invalidateQueries({ queryKey: ["mon-abonnement"] });
    queryClient.invalidateQueries({ queryKey: ["my-cotisations"] });
    onClose();
  }

  const PLAN_COLORS: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    gold: "border-amber-300 bg-amber-50",
  };

  const titre = renouveler ? "Renouveler l'abonnement" : "Choisir une formule";

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
              <h2 className="mt-0.5 text-lg font-bold text-white">{titre}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        {/* Suivi CinetPay */}
        {transactionId && (
          <CinetPaySuivi
            transactionId={transactionId}
            onSuccess={handleCinetPaySuccess}
            onCancel={() => { setTransactionId(null); setCinetpayUrl(null); setMode(null); }}
          />
        )}

        {/* Sélection formule + mode */}
        {!transactionId && (
          <>
            {/* Body — formules */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
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
                </button>
              ))}
            </div>

            {/* Choix mode de paiement */}
            {selected && (
              <div className="px-6 pb-2 space-y-2">
                <p className="text-xs font-semibold text-text-2 uppercase tracking-wide">Mode de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("CINETPAY")}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                      mode === "CINETPAY" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <FontAwesomeIcon icon={faMobileScreen} className="text-primary" style={{ fontSize: 20 }} />
                    <p className="text-xs font-semibold text-text-1">Mobile Money</p>
                    <p className="text-[10px] text-text-3 text-center">Moov · Orange · Wave</p>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Immédiat</span>
                  </button>
                  <button
                    onClick={() => setMode("PRESENTIEL")}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                      mode === "PRESENTIEL" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <FontAwesomeIcon icon={faStore} className="text-text-2" style={{ fontSize: 20 }} />
                    <p className="text-xs font-semibold text-text-1">En présentiel</p>
                    <p className="text-[10px] text-text-3 text-center">Paiement au guichet</p>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">Validation manuelle</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-text-2 transition hover:bg-surface"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!selected || !mode) return;
                  if (mode === "PRESENTIEL") souscrireMutation.mutate(selected.id);
                  else cinetpayMutation.mutate(selected.id);
                }}
                disabled={!selected || !mode || souscrireMutation.isPending || cinetpayMutation.isPending}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
              >
                {(souscrireMutation.isPending || cinetpayMutation.isPending) ? (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ fontSize: 12 }} />
                    {cinetpayMutation.isPending ? "Connexion CinetPay..." : "Envoi..."}
                  </span>
                ) : mode === "CINETPAY" ? (
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faExternalLink} style={{ fontSize: 12 }} />
                    Payer via CinetPay
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 12 }} />
                    Soumettre la demande
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Détail modal cotisation ──────────────────────────────────────────────

function DetailModal({ item, onClose }: { item: CotisationListItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div
          className="relative px-6 pb-4 pt-5"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Détail</p>
              <h2 className="mt-0.5 text-lg font-bold text-white">Abonnement #{item.id}</h2>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 text-sm">
          {[
            ["Adhérent", item.utilisateur],
            ["Email", item.email],
            ["Identifiant", item.identifiant],
            ["Formule", item.formule],
            ["Montant", `${item.montant.toLocaleString("fr-FR")} FCFA`],
            ["Code réservation", item.codeReservation],
            ["Début", item.dateDebut],
            ["Fin", item.dateFin],
            ["Paiement", item.datePaiement ?? "—"],
            ["Statut", item.statut],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-text-3">{label}</p>
              <p className="font-medium text-text-1 break-all">{val}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">Fermer</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tableau abonnements générique ───────────────────────────────────────────

function AbonnementsTable({
  isAdmin,
  formules,
}: {
  isAdmin: boolean;
  formules: FormulaAbonnement[];
}) {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [formule, setFormule] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<CotisationListItem | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const queryClient = useQueryClient();
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState<CotisationListItem | null>(null);

  const params = { page, size: 10, search: search || undefined, statut: statut || undefined, formule: formule || undefined };

  const { data } = useQuery({
    queryKey: isAdmin ? ["cotisations", params] : ["my-cotisations", params],
    queryFn: () => isAdmin
      ? abonnementsApi.getTous(params).then((r) => r.data)
      : abonnementsApi.getMesAbonnements(params).then((r) => r.data),
  });

  async function handleExport(type: "pdf" | "excel") {
    setExporting(type);
    try {
      const exportParams = { search: search || undefined, statut: statut || undefined, formule: formule || undefined };
      const res = isAdmin
        ? await (type === "pdf" ? abonnementsApi.exportPdf(exportParams) : abonnementsApi.exportExcel(exportParams))
        : await (type === "pdf" ? abonnementsApi.exportMesPdf(exportParams) : abonnementsApi.exportMesExcel(exportParams));
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `abonnements.${type === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(null);
    }
  }

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" style={{ fontSize: 12 }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher adhérent, email, code..."
            className="w-full rounded-lg border border-border pl-8 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(0); }}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="ACTIVE">Actif</option>
          <option value="EXPIREE">Expiré</option>
          <option value="REJETEE">Rejeté</option>
        </select>
        <select
          value={formule}
          onChange={(e) => { setFormule(e.target.value); setPage(0); }}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Toutes les formules</option>
          {formules.map((f) => <option key={f.id} value={f.nom}>{f.nom}</option>)}
        </select>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-light disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} />
            {exporting === "pdf" ? "Export..." : "PDF"}
          </button>
          <button
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 hover:bg-surface disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} />
            {exporting === "excel" ? "Export..." : "Excel"}
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-text-2">
            <tr>
              {["Code", "Adhérent", "Formule", "Montant", "Début", "Fin", "Statut", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-text-3">Aucun abonnement trouvé</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-surface">
                <td className="px-4 py-3 font-mono text-xs text-text-2">{item.codeReservation}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text-1">{item.utilisateur}</p>
                  <p className="text-xs text-text-3">{item.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{item.formule}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-text-1">{item.montant.toLocaleString("fr-FR")} FCFA</td>
                <td className="px-4 py-3 text-text-2 text-xs">{item.dateDebut}</td>
                <td className="px-4 py-3 text-text-2 text-xs">{item.dateFin}</td>
                <td className="px-4 py-3"><StatusBadge statut={item.statut} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDetail(item)}
                      className="rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface"
                      title="Voir détails"
                    >
                      <FontAwesomeIcon icon={faEye} style={{ fontSize: 11 }} />
                    </button>
                    {!isAdmin && (item.statut === "ACTIVE" || item.statut === "EXPIREE") && (
                      <button
                        onClick={() => { setRenewTarget(item); setShowRenewModal(true); }}
                        className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10"
                        title="Renouveler"
                      >
                        <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 11 }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Modal détail */}
      <AnimatePresence>
        {detail && <DetailModal item={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>

      {/* Modal renouvellement */}
      <AnimatePresence>
        {showRenewModal && renewTarget && (
          <SouscrireModal
            formules={formules}
            renouveler={true}
            onClose={() => { setShowRenewModal(false); setRenewTarget(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────

export default function AbonnementPage() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const [tab, setTab] = useState<"amendes" | "abonnement" | "attente" | "tous" | "mes-abonnements">("amendes");
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
    ...(canManage
      ? [
          { key: "tous", label: "Tous les abonnements" },
          { key: "attente", label: `Demandes en attente${(enAttente as DemandeEnAttente[]).length > 0 ? ` (${(enAttente as DemandeEnAttente[]).length})` : ""}` },
        ]
      : [{ key: "mes-abonnements", label: "Mes abonnements" }]
    ),
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

      {/* ── Onglet Tous les abonnements (admin/biblio) ── */}
      {canManage && tab === "tous" && (
        <AbonnementsTable isAdmin={true} formules={formules as FormulaAbonnement[]} />
      )}

      {/* ── Onglet Mes abonnements (membres) ── */}
      {!canManage && tab === "mes-abonnements" && (
        <AbonnementsTable isAdmin={false} formules={formules as FormulaAbonnement[]} />
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
