import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statistiquesApi } from "@/api/statistiques.api";
import { useEmprunts } from "@/hooks/useEmprunts";
import { useLivres } from "@/hooks/useLivres";
import { useAuthStore } from "@/stores/auth.store";
import { useExportConfirm } from "@/hooks/useExportConfirm";
import { exporterPDF } from "@/utils/exportPDF";
import { exporterExcel } from "@/utils/exportExcel";
import ExportConfirmModal from "@/components/shared/ExportConfirmModal";
import { useT } from "@/stores/i18n.store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar, faBookOpen, faTriangleExclamation, faArrowTrendUp, faFileArrowDown, faPrint } from "@fortawesome/free-solid-svg-icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Tab = "activite" | "retards" | "popularite" | "inventaire" | "rotation" | "dormants";

const COLORS = ["#1B4332", "#2D6A4F", "#40916C", "#74C69D", "#95D5B2", "#B7E4C7"];

export default function RapportsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("activite");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["dashboard", dateDebut, dateFin],
    queryFn: () => statistiquesApi.getDashboard(dateDebut || undefined, dateFin || undefined).then((r) => r.data),
  });

  const { data: retards } = useEmprunts({ statut: "EN_RETARD", size: 100 });
  const { data: livres } = useLivres({ page: 0, size: 200 });

  // Livres jamais empruntés : ceux qui ne figurent pas dans topLivres
  const livresActifsIds = new Set((stats?.topLivres ?? []).map((i) => i.livre.id));
  const livresDormants = (livres?.content ?? []).filter((l) => !livresActifsIds.has(l.id));

  const topLivres = (stats?.topLivres ?? []).map((item) => ({ name: item.livre.titre.substring(0, 25), emprunts: item.nbEmprunts }));
  const empruntsParJour = (stats?.empruntsParJour ?? []).slice(-14).map((e) => ({ date: e.date.substring(5), count: e.count }));
  const categories = (stats?.repartitionCategories ?? []).map((c) => ({ name: c.categorie, count: c.count }));

  // Taux de rotation : nbEmprunts / nbExemplaires pour chaque livre
  const tauxRotation = (stats?.topLivres ?? []).map((item) => ({
    name: item.livre.titre.substring(0, 22),
    taux: item.nbEmprunts,
    auteur: item.livre.auteur,
  })).sort((a, b) => b.taux - a.taux);

  const utilisateur = useAuthStore((s) => s.utilisateur);
  const { pending, requestExport, confirm, cancel } = useExportConfirm();

  const tabLabels: Record<Tab, string> = {
    activite:   t.rapports.activitePDF,
    retards:    t.rapports.retardsPDF,
    popularite: t.rapports.popularitePDF,
    rotation:   "Taux de rotation",
    inventaire: t.rapports.inventairePDF,
    dormants:   "Livres jamais empruntés",
  };

  const exportPDF = () => {
    const doExport = () => {
      if (tab === "activite") {
        exporterPDF(t.rapports.activitePDF, [t.rapports.dateDebut, t.dashboard.emprunts_col],
          empruntsParJour.map((e) => [e.date, e.count]), "rapport-activite", utilisateur);
      } else if (tab === "retards") {
        exporterPDF(t.rapports.retardsPDF, [t.rapports.adherent, t.rapports.livre, t.rapports.joursRetard, t.rapports.amendeFCFA],
          (retards?.content ?? []).map((e) => [
            `${e.utilisateur.prenom} ${e.utilisateur.nom}`, e.livre.titre, e.joursRetard, e.amende
          ]), "rapport-retards", utilisateur);
      } else if (tab === "popularite") {
        exporterPDF(t.rapports.popularitePDF, [t.rapports.livre, t.rapports.nbEmprunts],
          topLivres.map((item) => [item.name, item.emprunts]), "rapport-popularite", utilisateur);
      } else {
        exporterPDF(t.rapports.inventairePDF, [t.rapports.categorie, t.rapports.disponibles],
          categories.map((c) => [c.name, c.count]), "rapport-inventaire", utilisateur);
      }
    };
    requestExport("pdf", tabLabels[tab], doExport);
  };

  const exportExcel = () => {
    const doExport = () => {
      if (tab === "activite") {
        exporterExcel(t.rapports.activite, [t.rapports.dateDebut, "Emprunts"],
          empruntsParJour.map((e) => [e.date, e.count]), "rapport-activite", utilisateur);
      } else if (tab === "retards") {
        exporterExcel(t.rapports.retardsAmendes, [t.rapports.adherent, t.rapports.livre, t.rapports.joursRetard, t.rapports.amendeFCFA],
          (retards?.content ?? []).map((e) => [
            `${e.utilisateur.prenom} ${e.utilisateur.nom}`, e.livre.titre, e.joursRetard, e.amende
          ]), "rapport-retards", utilisateur);
      } else if (tab === "popularite") {
        exporterExcel(t.rapports.popularite, [t.rapports.livre, t.rapports.nbEmprunts],
          topLivres.map((item) => [item.name, item.emprunts]), "rapport-popularite", utilisateur);
      } else {
        exporterExcel(t.rapports.inventaire, [t.rapports.categorie, t.rapports.disponibles],
          categories.map((c) => [c.name, c.count]), "rapport-inventaire", utilisateur);
      }
    };
    requestExport("excel", tabLabels[tab], doExport);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.rapports.titreComplet}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF}
            className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5">
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 14 }} /> PDF
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg border border-success px-3 py-2 text-sm text-success hover:bg-success/5">
            <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 14 }} /> Excel
          </button>
          <button
            onClick={() => requestExport("print", tabLabels[tab], exportPDF)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-2 hover:bg-surface">
            <FontAwesomeIcon icon={faPrint} style={{ fontSize: 14 }} /> {t.rapports.imprimer}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.rapports.totalLivres,      value: stats?.totalLivres ?? "—",      icon: faBookOpen,            color: "text-primary"   },
          { label: t.rapports.empruntsEnCours,  value: stats?.empruntsEnCours ?? "—",  icon: faArrowTrendUp,        color: "text-blue-600"  },
          { label: t.rapports.retards,          value: stats?.retardsEnCours ?? "—",   icon: faTriangleExclamation, color: "text-danger"    },
          { label: t.rapports.amendesTotales,   value: stats ? `${stats.amendeTotal.toLocaleString("fr-FR")} FCFA` : "—", icon: faChartBar, color: "text-warning" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-2">{label}</p>
              <FontAwesomeIcon icon={icon} style={{ fontSize: 18 }} className={color} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
        <label className="space-y-1">
          <span className="text-xs text-text-2">{t.rapports.dateDebut}</span>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
            className="block h-9 rounded-lg border border-border px-2 text-sm" />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-2">{t.rapports.dateFin}</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
            className="block h-9 rounded-lg border border-border px-2 text-sm" />
        </label>
      </div>

      <div className="flex gap-1 border-b border-border">
        {([
          { id: "activite",   label: t.rapports.activite        },
          { id: "retards",    label: t.rapports.retardsAmendes  },
          { id: "popularite", label: t.rapports.popularite      },
          { id: "rotation",   label: "Taux de rotation"         },
          { id: "inventaire", label: t.rapports.inventaire      },
          { id: "dormants",   label: "Jamais empruntés"         },
        ] as const).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === id ? "border-primary text-primary" : "border-transparent text-text-2 hover:text-text-1"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "activite" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold">{t.rapports.emprunts14Jours}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={empruntsParJour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1B4332" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold">{t.rapports.repartitionCategorie}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "retards" && (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>{[t.rapports.adherent, t.rapports.livre, t.rapports.retourPrevu, t.rapports.joursRetard, t.rapports.amendeFCFA].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(retards?.content ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-text-3">{t.rapports.aucunRetard}</td></tr>
              ) : (retards?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</td>
                  <td className="px-4 py-3 text-text-2">{e.livre.titre}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-3 font-bold text-danger">{e.joursRetard}j</td>
                  <td className="px-4 py-3 font-medium">{e.amende.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "popularite" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <h3 className="mb-4 font-semibold">{t.rapports.top5Livres}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topLivres}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="emprunts" radius={[4, 4, 0, 0]}>
                    {topLivres.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>{["#", t.rapports.livre, t.livres.auteur, t.rapports.nbEmprunts].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(stats?.topLivres ?? []).map((item, i) => (
                  <tr key={item.livre.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-bold text-text-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{item.livre.titre}</td>
                    <td className="px-4 py-3 text-text-2">{item.livre.auteur}</td>
                    <td className="px-4 py-3 font-bold text-primary">{item.nbEmprunts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "rotation" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Taux de rotation des livres</h3>
              <p className="text-xs text-text-3">Nombre d'emprunts par titre — les livres jamais empruntés ne figurent pas ici</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tauxRotation} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip formatter={(v) => [`${v ?? 0} emprunt(s)`, "Rotation"]} />
                  <Bar dataKey="taux" radius={[0, 4, 4, 0]}>
                    {tauxRotation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-semibold">Détail par livre</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {["#", "Titre", "Auteur", "Nb emprunts", "Niveau d'activité"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tauxRotation.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-text-3">Aucune donnée</td></tr>
                ) : tauxRotation.map((item, i) => {
                  const niveau = item.taux >= 10 ? { label: "Très actif", color: "bg-green-100 text-green-700" }
                    : item.taux >= 5 ? { label: "Actif", color: "bg-blue-100 text-blue-700" }
                    : item.taux >= 2 ? { label: "Modéré", color: "bg-yellow-100 text-yellow-700" }
                    : { label: "Faible", color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={i} className="hover:bg-surface">
                      <td className="px-4 py-2.5 font-bold text-text-3">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-text-2">{item.auteur}</td>
                      <td className="px-4 py-2.5 font-bold text-primary">{item.taux}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${niveau.color}`}>{niveau.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "inventaire" && (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>{[t.rapports.livre, t.livres.auteur, t.livres.isbn, t.rapports.categorie, t.rapports.exemplaires, t.rapports.disponibles].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(livres?.content ?? []).map((l) => (
                <tr key={l.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium">{l.titre}</td>
                  <td className="px-4 py-3 text-text-2">{l.auteur}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-2">{l.isbn}</td>
                  <td className="px-4 py-3">{l.categorie?.nom ?? "—"}</td>
                  <td className="px-4 py-3">{l.nombreExemplaires}</td>
                  <td className="px-4 py-3">
                    <span className={l.nombreDisponibles > 0 ? "font-medium text-success" : "text-danger"}>
                      {l.nombreDisponibles}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "dormants" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Livres jamais empruntés</h3>
                <p className="text-xs text-text-3 mt-0.5">Ces livres n'ont aucun emprunt enregistré. Candidats au désherbage ou à la mise en valeur.</p>
              </div>
              <span className="rounded-full bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">
                {livresDormants.length} livre{livresDormants.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>{["Titre", "Auteur", "Catégorie", "Exemplaires", "Disponibles"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {livresDormants.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-text-3">Tous les livres ont été empruntés au moins une fois.</td></tr>
                ) : livresDormants.map((l) => (
                  <tr key={l.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{l.titre}</td>
                    <td className="px-4 py-3 text-text-2">{l.auteur}</td>
                    <td className="px-4 py-3">{l.categorie?.nom ?? "—"}</td>
                    <td className="px-4 py-3 text-center">{l.nombreExemplaires}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={l.nombreDisponibles > 0 ? "text-success font-medium" : "text-danger"}>
                        {l.nombreDisponibles}
                      </span>
                    </td>
                  </tr>
                ))}
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
