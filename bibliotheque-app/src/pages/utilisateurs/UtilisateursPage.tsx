import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowDown, faPrint } from "@fortawesome/free-solid-svg-icons";
import DataTable from "@/components/shared/DataTable";
import SearchBar from "@/components/shared/SearchBar";
import StatusBadge from "@/components/shared/StatusBadge";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useAuthStore } from "@/stores/auth.store";
import { useT } from "@/stores/i18n.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { exporterPDF, imprimerRecuAbonnement } from "@/utils/exportPDF";
import { exporterExcel } from "@/utils/exportExcel";
import type { Utilisateur } from "@/types";

export default function UtilisateursPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const t = useT();
  const { pending, requestExport, confirm, cancel } = useExportConfirm();
  const { data, isLoading } = useUtilisateurs({
    page,
    size: 10,
    q: search || undefined,
  });

  const columns = useMemo<Array<ColumnDef<Utilisateur>>>(
    () => [
      {
        header: t.utilisateurs.utilisateur,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.prenom} {row.original.nom}</p>
            <p className="text-xs text-text-2">{row.original.email}</p>
          </div>
        ),
      },
      { header: t.utilisateurs.identifiant, accessorKey: "identifiant" },
      { header: t.utilisateurs.telephone, accessorKey: "telephone" },
      { header: t.utilisateurs.role, accessorKey: "role" },
      {
        header: t.utilisateurs.statut,
        cell: ({ row }) => (
          <StatusBadge
            statut={row.original.actif ? "DISPONIBLE" : "ANNULEE"}
            label={row.original.actif ? t.statuts.ACTIF : t.statuts.INACTIF}
          />
        ),
      },
      { header: t.utilisateurs.retards, accessorKey: "nombreRetards" },
      {
        header: t.utilisateurs.actions,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link to={`/utilisateurs/${row.original.id}`} className="text-primary hover:underline text-xs">
              {t.utilisateurs.details}
            </Link>
            <button
              onClick={() => requestExport("print", `${t.utilisateurs.recuAbonnement} — ${row.original.prenom} ${row.original.nom}`, () => imprimerRecuAbonnement(row.original, utilisateur))}
              className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface"
            >
              <FontAwesomeIcon icon={faPrint} style={{ fontSize: 11 }} /> {t.utilisateurs.recuAbonnement}
            </button>
          </div>
        ),
      },
    ],
    [t, utilisateur, requestExport],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{t.utilisateurs.titre}</h1>
        <div className="flex items-center gap-2">
          <div className="w-64">
            <SearchBar value={search} onChange={setSearch} placeholder={t.utilisateurs.nomEmailId} />
          </div>
          <button
            onClick={() => requestExport("pdf", "Liste des utilisateurs", () => exporterPDF(
              "Liste des utilisateurs",
              ["Nom", "Email", "Identifiant", "Rôle", "Statut", "Retards"],
              (data?.content ?? []).map((u) => [
                `${u.prenom} ${u.nom}`, u.email, u.identifiant, u.role, u.actif ? "Actif" : "Inactif", u.nombreRetards
              ]),
              "utilisateurs", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5">
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 15 }} /> PDF
          </button>
          <button
            onClick={() => requestExport("excel", "Liste des utilisateurs", () => exporterExcel(
              "Utilisateurs",
              ["Nom", "Email", "Identifiant", "Rôle", "Statut", "Retards"],
              (data?.content ?? []).map((u) => [
                `${u.prenom} ${u.nom}`, u.email, u.identifiant, u.role, u.actif ? "Actif" : "Inactif", u.nombreRetards
              ]),
              "utilisateurs", utilisateur
            ))}
            className="flex items-center gap-2 rounded-lg border border-success px-3 py-2 text-sm text-success hover:bg-success/5">
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 15 }} /> Excel
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data?.content ?? []}
        isLoading={isLoading}
        pagination={{ pageIndex: data?.number ?? 0, pageSize: data?.size ?? 10, totalPages: data?.totalPages ?? 1 }}
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
    </section>
  );
}
