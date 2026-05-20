import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileArrowDown, faPrint, faCircleCheck, faTriangleExclamation, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import SearchBar from "@/components/shared/SearchBar";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import { useEmprunts, useRetourEmprunt, useRenouvelerEmprunt } from "@/hooks/useEmprunts";
import { useAuthStore } from "@/stores/auth.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { exporterPDF, imprimerRecuEmprunt } from "@/utils/exportPDF";
import { exporterExcel } from "@/utils/exportExcel";
import type { Emprunt, StatutEmprunt } from "@/types";
import { useT, useI18nStore } from "@/stores/i18n.store";

export default function EmpruntsPage() {
  const t = useT();
  const { locale } = useI18nStore();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const isStaff = utilisateur?.role === "ADMIN" || utilisateur?.role === "BIBLIOTHECAIRE";

  const TABS: Array<{ key: "TOUS" | StatutEmprunt; label: string }> = [
    { key: "EN_COURS",  label: t.statuts.EN_COURS },
    { key: "EN_RETARD", label: t.statuts.EN_RETARD },
    { key: "RETOURNE",  label: t.statuts.RETOURNE },
    { key: "TOUS",      label: locale === "fr" ? "Tous" : "All" },
  ];

  const [statut, setStatut] = useState<"TOUS" | StatutEmprunt>("EN_COURS");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [retourConfirme, setRetourConfirme] = useState<Emprunt | null>(null);
  const retourMutation = useRetourEmprunt();
  const renouvelerMutation = useRenouvelerEmprunt();
  const { pending, requestExport, confirm, cancel } = useExportConfirm();

  const queryParams: Record<string, unknown> = {
    page,
    size: 10,
    statut: statut === "TOUS" ? undefined : statut,
  };

  const { data, isLoading } = useEmprunts(queryParams);

  // Retards de l'utilisateur courant (membres uniquement)
  const { data: mesRetards } = useEmprunts(
    !isStaff ? { statut: "EN_RETARD", size: 100 } : undefined
  );
  const nbRetards = !isStaff ? (mesRetards?.totalElements ?? 0) : 0;

  const columns = useMemo<Array<ColumnDef<Emprunt>>>(() => {
    const cols: Array<ColumnDef<Emprunt>> = [];

    if (isStaff) {
      cols.push({
        header: t.emprunts.adherent,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.utilisateur.prenom} {row.original.utilisateur.nom}</p>
            <p className="text-xs text-text-2">{row.original.utilisateur.identifiant}</p>
          </div>
        ),
      });
    }

    cols.push(
      {
        header: t.emprunts.livre,
        cell: ({ row }) => (
          <div>
            <p className="font-medium line-clamp-1">{row.original.livre?.titre ?? "—"}</p>
            <p className="text-xs font-mono text-text-2">{row.original.exemplaire?.codeExemplaire ?? "—"}</p>
          </div>
        ),
      },
      { header: t.emprunts.dateEmprunt, accessorKey: "dateEmprunt" },
      { header: t.emprunts.dateRetourPrevue, accessorKey: "dateRetourPrevue" },
      {
        header: t.emprunts.dateRetourEffective,
        cell: ({ row }) => (
          <span>
            {row.original.dateRetourEffective ?? "Non retourné"}
          </span>
        ),
      },
      {
        header: t.emprunts.statut,
        cell: ({ row }) => <StatusBadge statut={row.original.statut} />,
      },
      {
        header: locale === "fr" ? "Retard / Amende" : "Overdue / Fine",
        cell: ({ row }) => (
          <div>
            {row.original.joursRetard > 0 && (
              <p className="text-xs font-medium text-danger">{row.original.joursRetard}j de retard</p>
            )}
            {row.original.amende > 0 && (
              <p className="text-xs font-semibold text-danger">
                {row.original.amende.toLocaleString("fr-FR")} FCFA
                {row.original.amendePayee && (
                  <span className="ml-1 text-success">✓ payée</span>
                )}
              </p>
            )}
          </div>
        ),
      },
      {
        header: t.emprunts.actions,
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {(row.original.statut === "EN_COURS" || row.original.statut === "EN_RETARD") && (
              <>
                {isStaff && (
                  <button
                    onClick={() =>
                      retourMutation.mutate(row.original.id, {
                        onSuccess: (data) => setRetourConfirme(data.data),
                      })
                    }
                    disabled={retourMutation.isPending}
                    className="rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
                  >
                    {t.emprunts.retourner}
                  </button>
                )}
                <button
                  onClick={() => renouvelerMutation.mutate(row.original.id)}
                  disabled={renouvelerMutation.isPending || row.original.nombreRenouvellements >= 1}
                  className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  {t.emprunts.prolonger}
                </button>
              </>
            )}
            <button
              onClick={() =>
                requestExport(
                  "print",
                  `${t.reservations.recu} — ${row.original.livre?.titre}`,
                  () => imprimerRecuEmprunt(row.original, utilisateur)
                )
              }
              className="rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faPrint} style={{ fontSize: 11 }} /> {t.reservations.recu}
            </button>
          </div>
        ),
      }
    );

    return cols;
  }, [t, locale, isStaff, retourMutation, renouvelerMutation, utilisateur, requestExport]);

  const filtered = (data?.content ?? []).filter(
    (e) =>
      !search ||
      e.utilisateur.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.utilisateur.prenom.toLowerCase().includes(search.toLowerCase()) ||
      (e.livre?.titre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.exemplaire?.codeExemplaire ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="space-y-4">
      {/* Bandeau alerte retard pour les membres */}
      {!isStaff && nbRetards > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0 text-danger" style={{ fontSize: 18 }} />
          <div>
            <p className="font-semibold text-danger">
              Vous avez {nbRetards} emprunt{nbRetards > 1 ? "s" : ""} en retard
            </p>
            <p className="text-sm text-red-600">
              Des amendes sont appliquées automatiquement. Veuillez retourner vos documents dès que possible.
            </p>
            <button
              onClick={() => { setStatut("EN_RETARD"); setPage(0); }}
              className="mt-2 text-sm font-medium text-danger underline hover:no-underline"
            >
              Voir mes emprunts en retard
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {isStaff ? t.emprunts.titre : "Mes emprunts"}
          </h1>
          {!isStaff && (
            <p className="text-sm text-text-2">Consultez vos emprunts en cours, en retard et votre historique</p>
          )}
        </div>
        {isStaff && (
          <Link
            to="/emprunts/nouveau"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light"
          >
            + {t.emprunts.nouvelEmprunt}
          </Link>
        )}
        {isStaff && (
          <>
            <button
              onClick={() =>
                requestExport("pdf", "Liste des emprunts", () =>
                  exporterPDF(
                    "Liste des emprunts",
                    ["Adhérent", "Livre", "Emprunté le", "Retour prévu", "Statut", "Amende (FCFA)"],
                    (data?.content ?? []).map((e) => [
                      `${e.utilisateur.prenom} ${e.utilisateur.nom}`,
                      e.livre?.titre, e.dateEmprunt, e.dateRetourPrevue, e.statut, e.amende,
                    ]),
                    "emprunts",
                    utilisateur
                  )
                )
              }
              className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5"
            >
              <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 15 }} /> PDF
            </button>
            <button
              onClick={() =>
                requestExport("excel", "Liste des emprunts", () =>
                  exporterExcel(
                    "Emprunts",
                    ["Adhérent", "Livre", "Emprunté le", "Retour prévu", "Statut", "Amende (FCFA)"],
                    (data?.content ?? []).map((e) => [
                      `${e.utilisateur.prenom} ${e.utilisateur.nom}`,
                      e.livre?.titre, e.dateEmprunt, e.dateRetourPrevue, e.statut, e.amende,
                    ]),
                    "emprunts",
                    utilisateur
                  )
                )
              }
              className="flex items-center gap-2 rounded-lg border border-success px-3 py-2 text-sm text-success hover:bg-success/5"
            >
              <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 15 }} /> Excel
            </button>
          </>
        )}
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
              {tab.key === "EN_RETARD" && !isStaff && nbRetards > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white px-1">
                  {nbRetards}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Livre, adhéren, code exemplaire..." />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        pagination={{
          pageIndex: data?.number ?? 0,
          pageSize: data?.size ?? 10,
          totalPages: data?.totalPages ?? 1,
        }}
        onPageChange={setPage}
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

      {retourConfirme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-2xl">
            <button
              onClick={() => setRetourConfirme(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-text-3 hover:bg-surface"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 30 }} className="text-success" />
              </div>
              <h3 className="font-heading text-xl font-bold">Retour enregistré</h3>
              <p className="mt-1 text-sm text-text-2">Le document a bien été rendu.</p>
            </div>
            <div className="mt-5 space-y-2 rounded-lg border border-border bg-surface p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-3">{t.emprunts.livre}</span>
                <span className="font-medium text-right max-w-[60%] line-clamp-1">{retourConfirme.livre?.titre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">{t.reservations.adherent}</span>
                <span className="font-medium">{retourConfirme.utilisateur?.prenom} {retourConfirme.utilisateur?.nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">Date de retour</span>
                <span className="font-medium">{retourConfirme.dateRetourEffective}</span>
              </div>
              {retourConfirme.amende > 0 ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 16 }} className="text-danger shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-danger">Amende générée</p>
                    <p className="text-sm font-bold text-danger">{retourConfirme.amende.toLocaleString("fr-FR")} FCFA</p>
                    <p className="text-xs text-text-3">{retourConfirme.joursRetard} jour(s) de retard</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3">
                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 16 }} className="text-success shrink-0" />
                  <p className="text-xs font-medium text-success">Retour dans les délais, aucune amende</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setRetourConfirme(null)}
              className="mt-5 w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-light"
            >
              {t.actions.fermer}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
