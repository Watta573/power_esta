import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation, faCircleCheck, faCircleDollarToSlot,
  faDollarSign, faUsers, faEye, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "@/components/shared/StatusBadge";
import { useAmendes, usePayerAmende } from "@/hooks/useEmprunts";
import type { Emprunt } from "@/types";

type Filtre = "NON_PAYEES" | "PAYEES" | "TOUTES";

const FILTRES: { id: Filtre; label: string }[] = [
  { id: "NON_PAYEES", label: "Non payées" },
  { id: "PAYEES",     label: "Payées"     },
  { id: "TOUTES",     label: "Toutes"     },
];

export default function AmendesPage() {
  const [filtre, setFiltre] = useState<Filtre>("NON_PAYEES");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Emprunt | null>(null);
  const payerMutation = usePayerAmende();

  const payeeParam = filtre === "TOUTES" ? undefined : filtre === "PAYEES";
  const { data, isLoading } = useAmendes({ payee: payeeParam, page, size: 20 });

  const content = data?.content ?? [];
  const nbNonPayees = content.filter((e) => !e.amendePayee).length;
  const nbPayees    = content.filter((e) => e.amendePayee).length;
  const totalDu     = content.filter((e) => !e.amendePayee).reduce((s, e) => s + e.amende, 0);

  return (
    <section className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Gestion des amendes</h1>
        <p className="text-sm text-text-2">Retours en retard, encaissement et suivi des amendes</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Amendes non payées",
            value: nbNonPayees,
            icon: faTriangleExclamation,
            color: "text-danger",
          },
          {
            label: "Amendes payées",
            value: nbPayees,
            icon: faCircleCheck,
            color: "text-success",
          },
          {
            label: "Total dû (page courante)",
            value: `${totalDu.toLocaleString("fr-FR")} FCFA`,
            icon: faDollarSign,
            color: "text-danger",
          },
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

      {/* Tabs filtre */}
      <div className="flex gap-1 border-b border-border">
        {FILTRES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setFiltre(id); setPage(0); }}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              filtre === id
                ? "border-primary text-primary"
                : "border-transparent text-text-2 hover:text-text-1"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-text-2">
            <tr>
              {["Utilisateur", "Livre", "Retour prévu", "Retourné le", "Retard", "Amende", "Statut emprunt", "Paiement", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-text-3">Chargement...</td></tr>
            ) : content.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <FontAwesomeIcon icon={faUsers} className="mb-2 text-3xl text-text-3" />
                  <p className="text-text-3">Aucune amende trouvée</p>
                </td>
              </tr>
            ) : content.map((e) => (
              <tr key={e.id} className="hover:bg-surface">
                <td className="px-4 py-3">
                  <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
                  <p className="text-xs text-text-2">{e.utilisateur.email}</p>
                  <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {e.utilisateur.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium line-clamp-1">{e.livre?.titre ?? "—"}</p>
                  <p className="text-xs text-text-2">{e.exemplaire?.codeExemplaire ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                <td className="px-4 py-3 text-text-2">{e.dateRetourEffective ?? "—"}</td>
                <td className="px-4 py-3 font-bold text-danger">{e.joursRetard}j</td>
                <td className="px-4 py-3 font-semibold text-danger">{e.amende.toLocaleString("fr-FR")} FCFA</td>
                <td className="px-4 py-3"><StatusBadge statut={e.statut} /></td>
                <td className="px-4 py-3">
                  {e.amendePayee ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 10 }} /> Payée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                      <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 10 }} /> Non payée
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {!e.amendePayee && (
                      <button
                        onClick={() => payerMutation.mutate(e.id)}
                        disabled={payerMutation.isPending}
                        className="flex items-center gap-1 rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCircleDollarToSlot} style={{ fontSize: 11 }} />
                        Encaisser
                      </button>
                    )}
                    <button
                      onClick={() => setDetail(e)}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface hover:text-primary"
                    >
                      <FontAwesomeIcon icon={faEye} style={{ fontSize: 11 }} />
                      Détails
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-text-2">{data?.totalElements} dossier(s)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.totalPages ?? 1) - 1}
                className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modele pour détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 rounded-lg p-1 text-text-3 hover:bg-surface">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
            </button>
            <h3 className="font-heading text-lg font-bold mb-4">Détail de l'amende</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Adhérent", `${detail.utilisateur.prenom} ${detail.utilisateur.nom}`],
                ["Email", detail.utilisateur.email],
                ["Rôle", detail.utilisateur.role],
                ["Livre", detail.livre?.titre ?? "—"],
                ["Exemplaire", detail.exemplaire?.codeExemplaire ?? "—"],
                ["Emprunté le", detail.dateEmprunt],
                ["Retour prévu", detail.dateRetourPrevue],
                ["Retourné le", detail.dateRetourEffective ?? <span className="italic text-text-3">Non retourné</span>],
                ["Jours de retard", detail.joursRetard > 0 ? `${detail.joursRetard} jour(s)` : "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between rounded-lg bg-surface px-3 py-2">
                  <span className="text-text-3">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
              <div className={`flex justify-between rounded-lg px-3 py-2 ${
                detail.amendePayee ? "bg-success/10" : "bg-danger/10"
              }`}>
                <span className={detail.amendePayee ? "text-success" : "text-danger"}>Amende</span>
                <span className={`font-bold ${detail.amendePayee ? "text-success" : "text-danger"}`}>
                  {detail.amende.toLocaleString("fr-FR")} FCFA
                  {detail.amendePayee && " ✓ payée"}
                </span>
              </div>
            </div>
            {!detail.amendePayee && (
              <button
                onClick={() => { payerMutation.mutate(detail.id); setDetail(null); }}
                disabled={payerMutation.isPending}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-success py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCircleDollarToSlot} style={{ fontSize: 14 }} />
                Encaisser l'amende
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
