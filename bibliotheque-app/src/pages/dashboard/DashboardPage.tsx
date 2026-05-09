import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen, faLayerGroup, faClipboardList, faTriangleExclamation,
  faCircleExclamation, faBookmark, faCoins, faCheckCircle, faRotateRight,
  faIdCard, faCalendarCheck, faCalendarXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useEmprunts } from "@/hooks/useEmprunts";
import { useReservations } from "@/hooks/useReservations";
import { useAuthStore } from "@/stores/auth.store";
import { useT, useI18nStore } from "@/stores/i18n.store";
import { empruntsApi } from "@/api/emprunts.api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const chartColors = ["#1B4332", "#2D6A4F", "#40916C", "#74C69D", "#95D5B2"];

function DashboardAdmin() {
  const t = useT();
  const { data, isLoading } = useDashboardStats();
  const { data: retards } = useEmprunts({ page: 0, size: 5, statut: "EN_RETARD" });
  const { data: empruntsRecents } = useEmprunts({ page: 0, size: 5, statut: "EN_COURS" });

  return (
    <div className="space-y-6">
      {(retards?.totalElements ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
          <FontAwesomeIcon icon={faCircleExclamation} className="text-danger" style={{ fontSize: 16 }} />
          <span className="text-sm font-medium text-danger">
            {retards?.totalElements} {t.dashboard.retardsRequierent}
          </span>
          <Link to="/emprunts" className="ml-auto text-xs text-danger underline hover:no-underline">
            {t.dashboard.voir}
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard titre={t.dashboard.totalLivres}     valeur={data?.totalLivres ?? "--"}            icone={<FontAwesomeIcon icon={faBookOpen}            style={{ fontSize: 18 }} />} variation={0} />
        <StatCard titre={t.dashboard.disponibles}     valeur={data?.exemplairesDisponibles ?? "--"} icone={<FontAwesomeIcon icon={faLayerGroup}          style={{ fontSize: 18 }} />} variation={0} />
        <StatCard titre={t.dashboard.empruntsEnCours} valeur={data?.empruntsEnCours ?? "--"}        icone={<FontAwesomeIcon icon={faClipboardList}       style={{ fontSize: 18 }} />} variation={0} />
        <StatCard titre={t.dashboard.retards}         valeur={data?.retardsEnCours ?? "--"}         icone={<FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 18 }} />} variation={0} couleur="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <h3 className="mb-4 font-semibold">{t.dashboard.emprunts30Jours}</h3>
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (data?.empruntsParJour ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                <AreaChart data={data!.empruntsParJour}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2D6A4F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1B4332" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-3">
                <p>{t.dashboard.aucuneDonnee}</p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <h3 className="mb-4 font-semibold">{t.dashboard.repartitionCategorie}</h3>
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (data?.repartitionCategories ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                <PieChart>
                  <Pie data={data!.repartitionCategories} dataKey="count" nameKey="categorie"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {data!.repartitionCategories.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-3">
                <p>{t.dashboard.aucuneDonnee}</p>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-border bg-white shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">{t.dashboard.top5Livres}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">#</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.dashboard.titre_col}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.dashboard.emprunts_col}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-text-3">{t.dashboard.chargement}</td></tr>
              ) : (data?.topLivres ?? []).length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-text-3">{t.dashboard.aucuneDonnee}</td></tr>
              ) : (data?.topLivres ?? []).map((item, i) => (
                <tr key={item.livre.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5 font-bold text-text-3">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium line-clamp-1">{item.livre.titre}</p>
                    <p className="text-xs text-text-2">{item.livre.auteur}</p>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-primary">{item.nbEmprunts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-xl border border-border bg-white shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">{t.dashboard.empruntsRecents}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">{t.dashboard.adherent_col}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.dashboard.livre_col}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.emprunts.dateRetourPrevue}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.emprunts.statut}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(empruntsRecents?.content ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-text-3">{t.dashboard.aucunEmprunt}</td></tr>
              ) : (empruntsRecents?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5 font-medium">{e.utilisateur.prenom} {e.utilisateur.nom}</td>
                  <td className="px-4 py-2.5 text-text-2 line-clamp-1">{e.livre.titre}</td>
                  <td className="px-4 py-2.5 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-2.5"><StatusBadge statut={e.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm text-text-2">{t.dashboard.empruntsAujourdhui}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{data?.empruntsAujourdhui ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm text-text-2">{t.dashboard.reservationsActives}</p>
          <p className="mt-1 text-2xl font-bold text-warning">{data?.reservationsEnAttente ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm text-text-2">{t.dashboard.totalAmendes}</p>
          <p className="mt-1 text-2xl font-bold text-danger">
            {(data?.amendeTotal ?? 0).toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardMembre() {
  const t = useT();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const uid = utilisateur?.id;
  const queryClient = useQueryClient();
  const [prolonging, setProlonging] = useState<number | null>(null);

  const { data: empruntsEnCours } = useEmprunts({ page: 0, size: 5, statut: "EN_COURS",  utilisateurId: uid });
  const { data: empruntsRetard  } = useEmprunts({ page: 0, size: 5, statut: "EN_RETARD", utilisateurId: uid });
  const { data: reservations    } = useReservations({ page: 0, size: 5, utilisateurId: uid, statut: "EN_ATTENTE" });

  const totalAmende = (empruntsRetard?.content ?? []).reduce((s, e) => s + (e.amende ?? 0), 0);

  const prolonger = async (empruntId: number) => {
    setProlonging(empruntId);
    try {
      await empruntsApi.renouveler(empruntId);
      toast.success("Emprunt prolongé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["emprunts"] });
    } catch {
      toast.error("Impossible de prolonger cet emprunt.");
    } finally {
      setProlonging(null);
    }
  };

  return (
    <div className="space-y-6">
      {(empruntsRetard?.totalElements ?? 0) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
          <FontAwesomeIcon icon={faCircleExclamation} className="text-danger" style={{ fontSize: 16 }} />
          <span className="text-sm font-medium text-danger">
            {t.dashboard.vousAvezRetard} {empruntsRetard?.totalElements} {t.dashboard.empruntsEnRetard}
          </span>
          <Link to="/emprunts" className="ml-auto text-xs text-danger underline hover:no-underline">
            {t.dashboard.voir}
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FontAwesomeIcon icon={faClipboardList} className="text-primary" style={{ fontSize: 18 }} />
            </div>
            <div>
              <p className="text-xs text-text-2">{t.dashboard.empruntsEnCours}</p>
              <p className="text-2xl font-bold text-primary">{empruntsEnCours?.totalElements ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-danger" style={{ fontSize: 18 }} />
            </div>
            <div>
              <p className="text-xs text-text-2">{t.dashboard.enRetard}</p>
              <p className="text-2xl font-bold text-danger">{empruntsRetard?.totalElements ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-purple-600" style={{ fontSize: 18 }} />
            </div>
            <div>
              <p className="text-xs text-text-2">{t.dashboard.reservationsActives}</p>
              <p className="text-2xl font-bold text-purple-600">{reservations?.totalElements ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <FontAwesomeIcon icon={faCoins} className="text-warning" style={{ fontSize: 18 }} />
            </div>
            <div>
              <p className="text-xs text-text-2">{t.dashboard.amendesDues}</p>
              <p className="text-2xl font-bold text-warning">{totalAmende.toLocaleString("fr-FR")} FCFA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-border bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold">{t.dashboard.mesEmpruntsEnCours}</h3>
            <Link to="/emprunts" className="text-xs text-primary hover:underline">{t.dashboard.voirTout}</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">{t.dashboard.livre_col}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.emprunts.dateRetourPrevue}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.emprunts.statut}</th>
                <th className="px-4 py-2.5 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(empruntsEnCours?.content ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-3">
                    <FontAwesomeIcon icon={faCheckCircle} className="mb-1 text-success" style={{ fontSize: 20 }} />
                    <p>{t.dashboard.aucunEmprunt}</p>
                  </td>
                </tr>
              ) : (empruntsEnCours?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5">
                    <p className="font-medium line-clamp-1">{e.livre.titre}</p>
                    <p className="text-xs text-text-2">{e.livre.auteur}</p>
                  </td>
                  <td className="px-4 py-2.5 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-2.5"><StatusBadge statut={e.statut} /></td>
                  <td className="px-4 py-2.5">
                    {e.nombreRenouvellements < 1 ? (
                      <button
                        onClick={() => prolonger(e.id)}
                        disabled={prolonging === e.id}
                        className="flex items-center gap-1.5 rounded-lg border border-primary px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-50 transition-colors"
                      >
                        <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 11 }} className={prolonging === e.id ? "animate-spin" : ""} />
                        Prolonger
                      </button>
                    ) : (
                      <span className="text-xs text-text-3">Max atteint</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-xl border border-border bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold">{t.dashboard.mesReservationsEnAttente}</h3>
            <Link to="/reservations" className="text-xs text-primary hover:underline">{t.dashboard.voirTout}</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">{t.dashboard.livre_col}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.reservations.position}</th>
                <th className="px-4 py-2.5 text-left font-medium">{t.reservations.expiration}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(reservations?.content ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-3">
                    <FontAwesomeIcon icon={faCalendarXmark} className="mb-1 text-text-3" style={{ fontSize: 20 }} />
                    <p>{t.dashboard.aucuneReservation}</p>
                  </td>
                </tr>
              ) : (reservations?.content ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5">
                    <p className="font-medium line-clamp-1">{r.livre.titre}</p>
                    <p className="text-xs text-text-2">{r.livre.auteur}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      #{r.position}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-2 text-xs">{r.dateExpiration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
        <h3 className="mb-3 font-semibold">{t.dashboard.accesRapide}</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/livres" className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/5">
            <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: 13 }} /> {t.dashboard.catalogue}
          </Link>
          <Link to="/emprunts" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
            <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: 13 }} /> {t.dashboard.mesEmprunts}
          </Link>
          <Link to="/reservations" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
            <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 13 }} /> {t.dashboard.mesReservations}
          </Link>
          <Link to="/communication" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
            <FontAwesomeIcon icon={faCoins} style={{ fontSize: 13 }} /> {t.communication.titre}
          </Link>
          <Link to="/espace-membre" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
            <FontAwesomeIcon icon={faIdCard} style={{ fontSize: 13 }} /> {(t as any).espaceMembre?.titre ?? "Mon espace"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const { locale } = useI18nStore();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const isStaff     = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const dateLocale  = locale === "fr" ? fr : enUS;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.dashboard.bienvenue}, {utilisateur?.prenom ?? ""}</h1>
        <p className="text-sm text-text-3">{format(new Date(), "EEEE d MMMM yyyy", { locale: dateLocale })}</p>
      </div>
      {isStaff ? <DashboardAdmin /> : <DashboardMembre />}
    </section>
  );
}
