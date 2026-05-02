import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileArrowDown, faPrint, faBookmark, faPlus,
  faMagnifyingGlass, faXmark, faChevronRight,
  faUser, faEnvelope, faIdCard, faCircleCheck,
  faBookOpen, faTriangleExclamation, faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import SearchBar from "@/components/shared/SearchBar";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useAnnulerReservation, useConfirmerReservation, useRelancerReservation, useReservations, useSupprimerReservation } from "@/hooks/useReservations";
import { useAuthStore } from "@/stores/auth.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { exporterPDF, imprimerRecuReservation } from "@/utils/exportPDF";
import { exporterExcel } from "@/utils/exportExcel";
import { livresApi } from "@/api/livres.api";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { reservationsApi } from "@/api/reservations.api";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT, useI18nStore } from "@/stores/i18n.store";
import type { Reservation, StatutReservation, Livre } from "@/types";

// ─── Progression statut ───────────────────────────────────────────────────

const STEPS: StatutReservation[] = ["EN_ATTENTE", "DISPONIBLE", "CONFIRMEE"];

function ProgressionStatut({ statut }: { statut: StatutReservation }) {
  const t = useT();
  const stepLabels: Record<string, string> = {
    EN_ATTENTE: t.statuts.EN_ATTENTE,
    DISPONIBLE: t.statuts.DISPONIBLE,
    CONFIRMEE:  t.statuts.CONFIRMEE,
  };
  if (statut === "ANNULEE" || statut === "EXPIREE") {
    return (
      <span className={`text-xs font-medium ${statut === "EXPIREE" ? "text-danger" : "text-text-3"}`}>
        {statut === "EXPIREE" ? t.statuts.EXPIREE : t.statuts.ANNULEE}
      </span>
    );
  }
  const current = STEPS.indexOf(statut);
  return (
    <div className="flex items-center gap-0.5">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step} className="flex items-center gap-0.5">
            <span className={`text-[10px] font-medium ${
              active ? "text-primary" : done ? "text-text-2" : "text-text-3"
            }`}>
              {stepLabels[step]}
            </span>
            {i < STEPS.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 8 }} className="text-border mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Modale nouvelle réservation ─────────────────────────────────────────

function NouvelleReservationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]                   = useState<1 | 2>(1);
  const [searchLivre, setSearchLivre]     = useState("");
  const [searchUser, setSearchUser]       = useState("");
  const [livreChoisi, setLivreChoisi]     = useState<Livre | null>(null);
  const [utilisateurId, setUtilisateurId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const moi       = useAuthStore((s) => s.utilisateur);
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));

  const { data: livresIndisponiblesData, isLoading: loadingLivres } = useQuery({
    queryKey: ["livres-indisponibles", searchLivre],
    queryFn: () => livresApi.getIndisponibles({ q: searchLivre || undefined, size: 100 }).then((r) => r.data),
  });
  const livresIndisponibles = livresIndisponiblesData?.content ?? [];
  const { data: usersData }  = useUtilisateurs({ q: searchUser || undefined, size: 6 });

  const creerMutation = useMutation({
    mutationFn: reservationsApi.creer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Réservation enregistrée");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur lors de la réservation"),
  });

  const uid            = canManage ? utilisateurId : moi?.id ?? null;
  const userChoisi     = usersData?.content.find((u) => u.id === utilisateurId) ?? null;
  const totalSteps     = canManage ? 2 : 1;
  const canNext        = step === 1 ? !!livreChoisi : !!uid;
  const canSubmit      = !!livreChoisi && !!uid;

  function handleNext() {
    if (!canManage) { if (canSubmit) creerMutation.mutate({ utilisateurId: uid!, livreId: livreChoisi!.id }); }
    else if (step === 1) setStep(2);
    else if (canSubmit) creerMutation.mutate({ utilisateurId: uid!, livreId: livreChoisi!.id });
  }

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
        <div className="relative px-6 pb-4 pt-5" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Nouvelle réservation</p>
              <h2 className="mt-0.5 text-lg font-bold text-white">
                {step === 1 ? "Choisir un document" : "Sélectionner l'adhérent"}
              </h2>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* Stepper (seulement si admin/biblio) */}
          {canManage && (
            <div className="mt-4 flex items-center gap-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step === s ? "bg-white text-primary shadow-md" :
                    step > s   ? "bg-white/30 text-white" :
                                 "bg-white/10 text-white/40"
                  }`}>
                    {step > s ? "✓" : s}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    step === s ? "text-white" : step > s ? "text-white/60" : "text-white/30"
                  }`}>
                    {s === 1 ? "Document" : "Adhérent"}
                  </span>
                  {s < totalSteps && <div className="h-px w-8 rounded-full bg-white/20" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-4">
                {livreChoisi ? (
                  /* Livre sélectionné — carte récap */
                  <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FontAwesomeIcon icon={faBookmark} style={{ fontSize: 16 }} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-1 line-clamp-1">{livreChoisi.titre}</p>
                        <p className="text-sm text-text-2">{livreChoisi.auteur}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                            0 / {livreChoisi.nombreExemplaires} disponible
                          </span>
                          <span className="text-[11px] text-text-3">File d'attente active</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setLivreChoisi(null)}
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-text-3 shadow-sm hover:text-danger"
                    >
                      <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
                    </button>
                  </div>
                ) : (
                  /* Liste + recherche livres indisponibles */
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-1">Documents indisponibles</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13 }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
                      <input
                        autoFocus
                        value={searchLivre}
                        onChange={(e) => setSearchLivre(e.target.value)}
                        placeholder="Filtrer par titre, auteur, ISBN..."
                        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-white shadow-inner">
                      {loadingLivres ? (
                        <div className="flex items-center justify-center py-8">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                        </div>
                      ) : livresIndisponibles.length === 0 ? (
                        <div className="flex flex-col items-center gap-1 py-8 text-center">
                          <FontAwesomeIcon icon={faBookmark} style={{ fontSize: 22 }} className="text-text-3" />
                          <p className="text-sm font-medium text-text-2">Aucun document indisponible</p>
                          <p className="text-xs text-text-3">Tous les exemplaires sont actuellement disponibles</p>
                        </div>
                      ) : livresIndisponibles.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => { setLivreChoisi(l); setSearchLivre(""); }}
                          className="group flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition last:border-0 hover:bg-surface"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 group-hover:bg-primary/10">
                            <FontAwesomeIcon icon={faBookmark} style={{ fontSize: 13 }} className="text-text-3 group-hover:text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text-1">{l.titre}</p>
                            <p className="text-xs text-text-3">{l.auteur}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">0/{l.nombreExemplaires}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-4">
                {/* Récap livre */}
                <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                  <FontAwesomeIcon icon={faBookmark} style={{ fontSize: 12 }} className="text-primary" />
                  <span className="truncate text-sm font-medium text-text-1">{livreChoisi?.titre}</span>
                </div>

                {userChoisi ? (
                  /* Adhérent sélectionné */
                  <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {userChoisi.prenom[0]}{userChoisi.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-text-1">{userChoisi.prenom} {userChoisi.nom}</p>
                        <p className="text-xs text-text-3">{userChoisi.email} · {userChoisi.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUtilisateurId(null)}
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-text-3 shadow-sm hover:text-danger"
                    >
                      <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
                    </button>
                  </div>
                ) : (
                  /* Recherche adhérent */
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-1">Rechercher un adhérent</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13 }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
                      <input
                        autoFocus
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        placeholder="Nom, email, identifiant..."
                        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    {searchUser && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                        {(usersData?.content ?? []).length === 0 ? (
                          <div className="flex flex-col items-center gap-1 py-6">
                            <p className="text-sm text-text-3">Aucun adhérent trouvé</p>
                          </div>
                        ) : (usersData?.content ?? []).map((u) => (
                          <button
                            key={u.id}
                            onClick={() => { setUtilisateurId(u.id); setSearchUser(""); }}
                            className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-text-2 group-hover:bg-primary/10 group-hover:text-primary">
                              {u.prenom[0]}{u.nom[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-text-1">{u.prenom} {u.nom}</p>
                              <p className="text-xs text-text-3">{u.email}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-3">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={() => step === 2 ? setStep(1) : onClose()}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-text-2 transition hover:bg-surface"
          >
            {step === 2 && <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 11, transform: "rotate(180deg)" }} />}
            {step === 2 ? "Retour" : "Annuler"}
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext || creerMutation.isPending}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
          >
            {creerMutation.isPending ? (
              <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Enregistrement...</span>
            ) : step === 1 && canManage ? (
              <span className="flex items-center gap-1.5">Suivant <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 11 }} /></span>
            ) : (
              <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faBookmark} style={{ fontSize: 12 }} /> Confirmer la réservation</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const t = useT();
  const { locale } = useI18nStore();
  const TABS: Array<{ key: StatutReservation | "TOUTES"; label: string }> = [
    { key: "EN_ATTENTE", label: t.statuts.EN_ATTENTE },
    { key: "DISPONIBLE", label: t.statuts.DISPONIBLE },
    { key: "CONFIRMEE",  label: t.statuts.CONFIRMEE  },
    { key: "ANNULEE",    label: t.statuts.ANNULEE    },
    { key: "EXPIREE",    label: t.statuts.EXPIREE    },
    { key: "TOUTES",     label: locale === "fr" ? "Toutes" : "All" },
  ];
  const [page, setPage]           = useState(0);
  const [search, setSearch]       = useState("");
  const [statut, setStatut]       = useState<StatutReservation | "TOUTES">("EN_ATTENTE");
  const [showModal, setShowModal] = useState(false);

  // Confirm dialogs
  const [confirmAnnuler,   setConfirmAnnuler]   = useState<{ id: number; titre: string } | null>(null);
  const [confirmSupprimer, setConfirmSupprimer] = useState<{ id: number; titre: string } | null>(null);
  const [motifAnnulation,  setMotifAnnulation]  = useState("");

  const utilisateur = useAuthStore((s) => s.utilisateur);
  const canManage   = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const { pending, requestExport, confirm, cancel } = useExportConfirm();

  const { data, isLoading } = useReservations({
    page, size: 10,
    statut: statut === "TOUTES" ? undefined : statut,
    utilisateurId: canManage ? undefined : utilisateur?.id,
  });

  const confirmerMutation = useConfirmerReservation();
  const annulerMutation   = useAnnulerReservation();
  const relancerMutation  = useRelancerReservation();
  const supprimerMutation = useSupprimerReservation();
  const all = data?.content ?? [];

  const columns = useMemo<Array<ColumnDef<Reservation>>>(() => [
    {
      header: t.reservations.adherent,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.utilisateur.prenom} {row.original.utilisateur.nom}</p>
          <p className="text-xs text-text-2">{row.original.utilisateur.identifiant}</p>
        </div>
      ),
    },
    {
      header: t.reservations.livre,
      cell: ({ row }) => (
        <div>
          <p className="font-medium line-clamp-1">{row.original.livre.titre}</p>
          <p className="text-xs text-text-2">{row.original.livre.auteur}</p>
          <p className="text-[10px] text-text-3">File : #{row.original.position}</p>
        </div>
      ),
    },
    {
      header: t.reservations.statut,
      cell: ({ row }) => (
        <div className="space-y-1">
          <StatusBadge statut={row.original.statut} />
          <ProgressionStatut statut={row.original.statut} />
        </div>
      ),
    },
    { header: t.reservations.reserveLe, accessorKey: "dateReservation" },
    {
      header: t.reservations.expiration,
      cell: ({ row }) => {
        const expired = new Date(row.original.dateExpiration) < new Date();
        const jours   = Math.ceil((new Date(row.original.dateExpiration).getTime() - Date.now()) / 86400000);
        return (
          <div>
            <span className={expired ? "font-medium text-danger" : ""}>{row.original.dateExpiration}</span>
            {!expired && jours <= 3 && jours > 0 && (
              <p className="text-[10px] text-orange-500">{jours}{t.reservations.joursRestant}</p>
            )}
          </div>
        );
      },
    },
    {
      header: t.reservations.actions,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {canManage && row.original.statut === "DISPONIBLE" && (
            <button
              onClick={() => confirmerMutation.mutate(row.original.id)}
              disabled={confirmerMutation.isPending}
              className="rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
            >
              {t.actions.remettre}
            </button>
          )}
          {canManage && row.original.statut === "EN_ATTENTE" && (
            <button
              onClick={() => confirmerMutation.mutate(row.original.id)}
              disabled={confirmerMutation.isPending}
              className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {t.actions.disponible}
            </button>
          )}
          {["EN_ATTENTE", "DISPONIBLE"].includes(row.original.statut) && (
            (canManage
              ? row.original.utilisateur.id === utilisateur?.id  // staff : seulement les siennes
              : true                                              // non-staff : déjà filtré par le backend
            ) && (
            <button
              onClick={() => setConfirmAnnuler({ id: row.original.id, titre: row.original.livre.titre })}
              disabled={annulerMutation.isPending}
              className="rounded border border-danger px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {t.actions.annuler}
            </button>
            )
          )}
          {["EXPIREE", "ANNULEE"].includes(row.original.statut) && (
            <button
              onClick={() => relancerMutation.mutate(row.original.id)}
              disabled={relancerMutation.isPending}
              className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              🔄 {t.actions.relancer}
            </button>
          )}
          {canManage && ["ANNULEE", "EXPIREE", "CONFIRMEE"].includes(row.original.statut) && (
            <button
              onClick={() => setConfirmSupprimer({ id: row.original.id, titre: row.original.livre.titre })}
              disabled={supprimerMutation.isPending}
              className="rounded border border-danger/50 px-2 py-1 text-xs text-danger/70 hover:bg-danger/10 disabled:opacity-50"
            >
              {t.actions.supprimer}
            </button>
          )}
          <button
            onClick={() => requestExport("print", `${t.reservations.recu} — ${row.original.livre.titre}`, () => imprimerRecuReservation(row.original, utilisateur))}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface"
          >
            <FontAwesomeIcon icon={faPrint} style={{ fontSize: 11 }} /> {t.reservations.recu}
          </button>
        </div>
      ),
    },
  ], [t, confirmerMutation, annulerMutation, relancerMutation, supprimerMutation, canManage, utilisateur]);

  const filtered = all.filter((r) =>
    !search ||
    r.utilisateur.nom.toLowerCase().includes(search.toLowerCase()) ||
    r.livre.titre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{t.reservations.titre}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13 }} /> {t.reservations.nouvelleReservation}
          </button>
          <button
            onClick={() => requestExport("pdf", t.reservations.titre, () => exporterPDF(
              t.reservations.listeReservations,
              [t.reservations.adherent, t.reservations.livre, t.reservations.reserveLe, t.reservations.expiration, t.reservations.position, t.reservations.statut],
              all.map((r) => [`${r.utilisateur.prenom} ${r.utilisateur.nom}`, r.livre.titre, r.dateReservation, r.dateExpiration, r.position, r.statut]),
              "reservations", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 13 }} /> PDF
          </button>
          <button
            onClick={() => requestExport("excel", "Réservations", () => exporterExcel(
              "Réservations",
              ["Adhérent", "Livre", "Réservé le", "Expiration", "Position", "Statut"],
              all.map((r) => [`${r.utilisateur.prenom} ${r.utilisateur.nom}`, r.livre.titre, r.dateReservation, r.dateExpiration, r.position, r.statut]),
              "reservations", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-success px-3 py-2 text-sm text-success hover:bg-success/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 13 }} /> Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatut(tab.key); setPage(0); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                statut === tab.key ? "bg-primary text-white" : "text-text-2 hover:text-text-1"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="w-64">
          <SearchBar value={search} onChange={setSearch} placeholder={t.reservations.adherentLivre} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        pagination={{ pageIndex: data?.number ?? 0, pageSize: data?.size ?? 10, totalPages: data?.totalPages ?? 1 }}
        onPageChange={setPage}
      />

      {showModal && <NouvelleReservationModal onClose={() => setShowModal(false)} />}

      {/* Dialog confirmation annulation */}
      {confirmAnnuler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-text-1">{t.reservations.annulerReservation}</h3>
            <p className="mt-1 text-sm text-text-2 line-clamp-2">« {confirmAnnuler.titre} »</p>
            {canManage && (
              <div className="mt-4">
                <label className="text-xs font-medium text-text-2">{t.reservations.motif}</label>
                <textarea
                  value={motifAnnulation}
                  onChange={(e) => setMotifAnnulation(e.target.value)}
                  placeholder={t.reservations.motifPlaceholder}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setConfirmAnnuler(null); setMotifAnnulation(""); }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface"
              >
                {t.actions.retour}
              </button>
              <button
                onClick={() => {
                  annulerMutation.mutate(confirmAnnuler.id, {
                    onSettled: () => { setConfirmAnnuler(null); setMotifAnnulation(""); },
                  });
                }}
                disabled={annulerMutation.isPending}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
              >
                {annulerMutation.isPending ? t.reservations.annulation : t.reservations.confirmerAnnulation}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog confirmation suppression */}
      <ConfirmDialog
        open={!!confirmSupprimer}
        titre={t.reservations.supprimerReservation}
        message={t.reservations.suppressionIrreversible.replace("{titre}", confirmSupprimer?.titre ?? "")}
        danger
        onConfirm={() => {
          if (confirmSupprimer) supprimerMutation.mutate(confirmSupprimer.id, {
            onSettled: () => setConfirmSupprimer(null),
          });
        }}
        onCancel={() => setConfirmSupprimer(null)}
      />

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
