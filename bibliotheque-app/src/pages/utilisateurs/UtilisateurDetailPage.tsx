import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { utilisateursApi } from "@/api/utilisateurs.api";
import { useEmprunts } from "@/hooks/useEmprunts";
import { useReservations } from "@/hooks/useReservations";
import { useAuthStore } from "@/stores/auth.store";
import StatusBadge from "@/components/shared/StatusBadge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faCalendarCheck, faTriangleExclamation, faFileArrowDown, faPrint, faIdCard } from "@fortawesome/free-solid-svg-icons";
import { exporterPDF, imprimerRecuAbonnement } from "@/utils/exportPDF";
import { QRCodeSVG } from "qrcode.react";
import { useState, useRef } from "react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  BIBLIOTHECAIRE: "bg-blue-100 text-blue-700",
  ETUDIANT: "bg-green-100 text-green-700",
  ENSEIGNANT: "bg-purple-100 text-purple-700",
  PUBLIC: "bg-gray-100 text-gray-600",
};

export default function UtilisateurDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const uid = Number(id);

  const { data: utilisateur, isLoading } = useQuery({
    queryKey: ["utilisateur", uid],
    queryFn: () => utilisateursApi.getById(uid).then((r) => r.data),
    enabled: Number.isFinite(uid),
  });

  const exporteur = useAuthStore((s) => s.utilisateur);
  const [showCarte, setShowCarte] = useState(false);
  const carteRef = useRef<HTMLDivElement>(null);

  const { data: emprunts } = useEmprunts({ utilisateurId: uid, size: 50 });
  const { data: reservations } = useReservations({ utilisateurId: uid, size: 50 });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!utilisateur) return <p className="text-text-2">Utilisateur introuvable.</p>;

  return (
    <section className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-2 hover:text-text-1">
        <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 16 }} /> Retour
      </button>

      {/* Profil */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-2xl font-bold text-white">
              {utilisateur.prenom[0]}{utilisateur.nom[0]}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">{utilisateur.prenom} {utilisateur.nom}</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[utilisateur.role]}`}>{utilisateur.role}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${utilisateur.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {utilisateur.actif ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCarte(true)}
              className="flex items-center gap-2 rounded-lg border border-[#1b4332] px-3 py-2 text-sm text-[#1b4332] hover:bg-[#1b4332]/5"
            >
              <FontAwesomeIcon icon={faIdCard} style={{ fontSize: 15 }} /> Carte lecteur
            </button>
            <button
              onClick={() => imprimerRecuAbonnement(utilisateur, exporteur)}
              className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5"
            >
              <FontAwesomeIcon icon={faPrint} style={{ fontSize: 15 }} /> Reçu abonnement
            </button>
            <button
              onClick={() => exporterPDF(
                `Fiche adhérent — ${utilisateur.prenom} ${utilisateur.nom}`,
                ["Champ", "Valeur"],
                [
                  ["Nom", `${utilisateur.prenom} ${utilisateur.nom}`],
                  ["Identifiant", utilisateur.identifiant],
                  ["Email", utilisateur.email],
                  ["Téléphone", utilisateur.telephone || "—"],
                  ["Rôle", utilisateur.role],
                  ["Statut", utilisateur.actif ? "Actif" : "Inactif"],
                  ["Inscrit le", utilisateur.dateInscription],
                  ["Emprunts en cours", utilisateur.nombreEmpruntsEnCours],
                  ["Retards", utilisateur.nombreRetards],
                ],
                `fiche_adherent_${utilisateur.id}`, exporteur
              )}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-2 hover:bg-surface"
            >
              <FontAwesomeIcon icon={faFileArrowDown} style={{ fontSize: 15 }} /> Fiche PDF
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Identifiant", value: utilisateur.identifiant },
            { label: "Email", value: utilisateur.email },
            { label: "Téléphone", value: utilisateur.telephone || "—" },
            { label: "Inscrit le", value: utilisateur.dateInscription },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-surface p-3">
              <p className="text-xs text-text-3">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: 16 }} className="text-primary" />
            <span className="text-sm text-text-2">Emprunts en cours</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-primary">{utilisateur.nombreEmpruntsEnCours}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 16 }} className="text-danger" />
            <span className="text-sm text-text-2">Retards</span>
          </div>
          <p className={`mt-1 text-2xl font-bold ${utilisateur.nombreRetards > 0 ? "text-danger" : "text-text-1"}`}>{utilisateur.nombreRetards}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 16 }} className="text-success" />
            <span className="text-sm text-text-2">Total emprunts</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{emprunts?.totalElements ?? 0}</p>
        </div>
      </div>

      {/* Historique emprunts */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Historique des emprunts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                {["Livre", "Emprunté le", "Retour prévu", "Retour effectif", "Statut", "Retard / Amende"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(emprunts?.content ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-text-3">Aucun emprunt</td></tr>
              ) : (emprunts?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium">{e.livre.titre}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateEmprunt}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateRetourPrevue}</td>
                  <td className="px-4 py-3 text-text-2">{e.dateRetourEffective ?? <span className="italic text-text-3">Non retourné</span>}</td>
                  <td className="px-4 py-3"><StatusBadge statut={e.statut} /></td>
                  <td className="px-4 py-3">
                    {e.joursRetard > 0 && (
                      <p className="text-xs font-medium text-danger">{e.joursRetard}j de retard</p>
                    )}
                    {e.amende > 0
                      ? <span className="font-medium text-danger">{e.amende.toLocaleString("fr-FR")} FCFA{e.amendePayee && <span className="ml-1 text-success text-xs">✓ payée</span>}</span>
                      : <span className="text-text-3">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Réservations */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Réservations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                {["Livre", "Réservé le", "Expiration", "Statut", "Position"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(reservations?.content ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-text-3">Aucune réservation</td></tr>
              ) : (reservations?.content ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-medium">{r.livre.titre}</td>
                  <td className="px-4 py-3 text-text-2">{r.dateReservation}</td>
                  <td className="px-4 py-3 text-text-2">{r.dateExpiration}</td>
                  <td className="px-4 py-3"><StatusBadge statut={r.statut} /></td>
                  <td className="px-4 py-3">{r.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Carte lecteur */}
      {showCarte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Carte de lecteur</h2>
              <button onClick={() => setShowCarte(false)} className="text-text-3 hover:text-text-1 text-lg">&times;</button>
            </div>

            {/* Carte imprimable */}
            <div ref={carteRef} className="m-5 overflow-hidden rounded-xl border-2 border-[#1b4332]">
              {/* Header carte */}
              <div className="bg-[#1b4332] px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Bibliothèque</p>
                  <p className="text-sm font-bold text-white">ESTA</p>
                </div>
                <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: 22 }} className="text-[#e9c46a]" />
              </div>

              {/* Corps carte */}
              <div className="bg-white px-5 py-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1b4332] text-xl font-bold text-white">
                  {utilisateur.prenom[0]}{utilisateur.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{utilisateur.prenom} {utilisateur.nom}</p>
                  <p className="text-xs text-gray-500">{utilisateur.identifiant}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[utilisateur.role]}`}>
                    {utilisateur.role}
                  </span>
                </div>
                <div className="shrink-0">
                  <QRCodeSVG
                    value={JSON.stringify({ id: utilisateur.id, identifiant: utilisateur.identifiant, email: utilisateur.email })}
                    size={72}
                    bgColor="#ffffff"
                    fgColor="#1b4332"
                    level="M"
                  />
                </div>
              </div>

              {/* Footer carte */}
              <div className="bg-[#f0f7f4] px-5 py-2 flex items-center justify-between">
                <p className="text-[10px] text-gray-400">Inscrit le {utilisateur.dateInscription}</p>
                <p className="text-[10px] font-mono text-gray-400">{utilisateur.email}</p>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1b4332] py-2.5 text-sm font-medium text-white hover:bg-[#2d6a4f]"
              >
                <FontAwesomeIcon icon={faPrint} style={{ fontSize: 13 }} /> Imprimer
              </button>
              <button
                onClick={() => setShowCarte(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm text-text-2 hover:bg-surface"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
