import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { useEmprunts, useRetourEmprunt } from "@/hooks/useEmprunts";
import { useT } from "@/stores/i18n.store";
import type { Emprunt } from "@/types";

export default function RelancesPage() {
  const t = useT();
  const [page, setPage] = useState(0);
  const retourMutation = useRetourEmprunt();

  const { data: retards, isLoading } = useEmprunts({ statut: "EN_RETARD", page, size: 20 });
  const { data: enCours } = useEmprunts({ statut: "EN_COURS", page: 0, size: 100 });

  const expiresBientot = (enCours?.content ?? []).filter((e) => {
    const diff = (new Date(e.dateRetourPrevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });

  const totalAmendes = (retards?.content ?? []).reduce((s, e) => s + e.amende, 0);

  const columns = useMemo<Array<ColumnDef<Emprunt>>>(() => [
    {
      header: t.relances.adherent,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.utilisateur.prenom} {row.original.utilisateur.nom}</p>
          <p className="text-xs text-text-2">{row.original.utilisateur.email}</p>
        </div>
      ),
    },
    {
      header: t.relances.document,
      cell: ({ row }) => <span className="line-clamp-1 font-medium">{row.original.livre.titre}</span>,
    },
    { header: t.relances.retourPrevu, accessorKey: "dateRetourPrevue" },
    {
      header: t.relances.joursRetardCol,
      cell: ({ row }) => <span className="font-bold text-danger">{row.original.joursRetard}j</span>,
    },
    {
      header: t.relances.amende,
      cell: ({ row }) => <span className="font-medium">{row.original.amende.toLocaleString("fr-FR")} FCFA</span>,
    },
    { header: t.relances.statut, cell: ({ row }) => <StatusBadge statut={row.original.statut} /> },
    {
      header: t.relances.actions,
      cell: ({ row }) => (
        <button
          onClick={() => retourMutation.mutate(row.original.id)}
          disabled={retourMutation.isPending}
          className="rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
        >
          {t.relances.enregistrerRetour}
        </button>
      ),
    },
  ], [t, retourMutation]);

  const colonnesAlerte = useMemo<Array<ColumnDef<Emprunt>>>(() => [
    {
      header: t.relances.adherent,
      cell: ({ row }) => `${row.original.utilisateur.prenom} ${row.original.utilisateur.nom}`,
    },
    { header: t.relances.document, cell: ({ row }) => row.original.livre.titre },
    { header: t.relances.retourPrevu, accessorKey: "dateRetourPrevue" },
    {
      header: t.relances.joursRestants,
      cell: ({ row }) => {
        const diff = Math.ceil((new Date(row.original.dateRetourPrevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return <span className="font-medium text-warning">{diff}j</span>;
      },
    },
  ], [t]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.relances.titreComplet}</h1>
        <p className="text-sm text-text-2">{t.relances.sousTitre}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-danger" />
            <span className="font-semibold text-danger">{t.relances.enRetard}</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-danger">{retards?.totalElements ?? 0}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-warning" />
            <span className="font-semibold text-warning">{t.relances.expireDans3Jours}</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-warning">{expiresBientot.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-text-2">{t.relances.totalAmendesEnCours}</p>
          <p className="mt-1 text-2xl font-bold text-danger">{totalAmendes.toLocaleString("fr-FR")} FCFA</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-danger">{t.relances.empruntsEnRetard}</h2>
        <DataTable
          columns={columns}
          data={retards?.content ?? []}
          isLoading={isLoading}
          pagination={{ pageIndex: retards?.number ?? 0, pageSize: retards?.size ?? 20, totalPages: retards?.totalPages ?? 1 }}
          onPageChange={setPage}
        />
      </div>

      {expiresBientot.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold text-warning">{t.relances.expireBientot}</h2>
          <DataTable columns={colonnesAlerte} data={expiresBientot} />
        </div>
      )}
    </section>
  );
}
