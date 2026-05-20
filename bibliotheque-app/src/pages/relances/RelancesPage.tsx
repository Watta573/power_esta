import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation, faClockRotateLeft,
  faCircleCheck, faEnvelope, faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "@/components/shared/StatusBadge";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import SearchBar from "@/components/shared/SearchBar";
import { useEmprunts, useRetourEmprunt } from "@/hooks/useEmprunts";
import { useAuthStore } from "@/stores/auth.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { exporterPDF } from "@/utils/exportPDF";
import { useT } from "@/stores/i18n.store";

export default function RelancesPage() {
  const t = useT();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const retourMutation = useRetourEmprunt();
  const { pending, requestExport, confirm, cancel } = useExportConfirm();

  const { data: retards, isLoading } = useEmprunts({ statut: "EN_RETARD", page, size: 20 });
  const { data: enCours } = useEmprunts({ statut: "EN_COURS", page: 0, size: 100 });

  const expiresBientot = (enCours?.content ?? []).filter((e) => {
    const diff = (new Date(e.dateRetourPrevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= -0.5 && diff <= 3;
  });

  const totalAmendes = (retards?.content ?? []).reduce((s, e) => s + e.amende, 0);

  const retardsFiltres = (retards?.content ?? []).filter((e) =>
    !search ||
    `${e.utilisateur.prenom} ${e.utilisateur.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    (e.livre?.titre ?? "").toLowerCase().includes(search.toLowerCase()) ||
    e.utilisateur.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.relances.titreComplet}</h1>
          <p className="text-sm text-text-2">{t.relances.sousTitre}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              requestExport("pdf", "Relances & Amendes", () =>
                exporterPDF(
                  "Relances & Amendes",
                  ["Adhérent", "Email", "Livre", "Retour prévu", "Jours retard", "Amende (FCFA)"],
                  (retards?.content ?? []).map((e) => [
                    `${e.utilisateur.prenom} ${e.utilisateur.nom}`,
                    e.utilisateur.email,
                    e.livre?.titre ?? "—",
                    e.dateRetourPrevue,
                    e.joursRetard,
                    e.amende,
                  ]),
                  "relances",
                  utilisateur
                )
              )
            }
            className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 14 }} /> PDF
          </button>
          <Link
            to="/amendes"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
          >
            Gérer les amendes
          </Link>
        </div>
      </div>

      {/* Bandeau info relances automatiques */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <FontAwesomeIcon icon={faEnvelope} className="mt-0.5 shrink-0 text-black" style={{ fontSize: 16 }} />
        <div className="text-sm">
          <p className="font-semibold text-black">Relances automatiques actives</p>
          <p className="mt-0.5 text-black">
            Rappel email <strong>J-3</strong> Avant échéance, détection retards à <strong>8h00</strong> chaque matin.
            Amende <strong>100 FCFA/jour</strong> de retard
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: t.relances.enRetard,
            value: retards?.totalElements ?? 0,
            icon: faTriangleExclamation,
            color: "text-danger",
            bg: "bg-red-50 border-red-200",
          },
          {
            label: t.relances.expireDans3Jours,
            value: expiresBientot.length,
            icon: faClockRotateLeft,
            color: "text-warning",
            bg: "bg-yellow-50 border-yellow-200",
          },
          {
            label: t.relances.totalAmendesEnCours,
            value: `${totalAmendes.toLocaleString("fr-FR")} F`,
            icon: faTriangleExclamation,
            color: "text-danger",
            bg: "bg-white border-border",
          },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 shadow-sm ${bg}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-2">{label}</p>
              <FontAwesomeIcon icon={icon} style={{ fontSize: 18 }} className={color} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="w-72">
        <SearchBar value={search} onChange={setSearch} placeholder="Adhérent, livre, email..." />
      </div>

      {/* Table emprunts en retard */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-danger">{t.relances.empruntsEnRetard}</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                {[t.relances.adherent, t.relances.document, t.relances.retourPrevu, t.relances.joursRetardCol, t.relances.amende, t.relances.statut, t.relances.actions].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">Chargement...</td></tr>
              ) : (retards?.content ?? []).length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">Aucun emprunt en retard</td></tr>
              ) : retardsFiltres.map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
                    <p className="text-xs text-text-2">{e.utilisateur.email}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {e.utilisateur.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{e.livre?.titre ?? "—"}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-3 font-bold text-danger">{e.joursRetard}j</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-danger">{e.amende.toLocaleString("fr-FR")} FCFA</span>
                    {e.amendePayee && <span className="ml-1 text-xs text-success">✓ payée</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge statut={e.statut} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => retourMutation.mutate(e.id)}
                      disabled={retourMutation.isPending}
                      className="flex items-center gap-1 rounded border border-success px-2 py-1 text-xs text-success hover:bg-success/10 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 11 }} />
                      {t.relances.enregistrerRetour}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(retards?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-text-2">{retardsFiltres.length} / {retards?.totalElements} emprunt(s)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Précédent</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= (retards?.totalPages ?? 1) - 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Suivant</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table expire bientôt */}
      {expiresBientot.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-warning">{t.relances.expireBientot}</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {[t.relances.adherent, t.relances.document, t.relances.retourPrevu, t.relances.joursRestants].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expiresBientot.map((e) => {
                  const diff = Math.ceil((new Date(e.dateRetourPrevue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={e.id} className="hover:bg-surface">
                      <td className="px-4 py-3">
                        <p className="font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</p>
                        <p className="text-xs text-text-2">{e.utilisateur.email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{e.livre?.titre ?? "—"}</td>
                      <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                      <td className="px-4 py-3 font-semibold text-warning">{diff}j</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
