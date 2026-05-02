import { useState } from "react";
import { Bell, CheckCheck, Clock, History, Mail, Users } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useT } from "@/stores/i18n.store";
import { useLireNotification, useLireToutesNotifications, useNotifications } from "@/hooks/useNotifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notificationsApi, type DiffusionGroupee } from "@/api/notifications.api";
import { toast } from "sonner";
import type { Notification } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  RAPPEL_RETOUR:      "bg-yellow-100 text-yellow-700",
  LIVRE_DISPONIBLE:   "bg-green-100 text-green-700",
  RETARD_CONSTATE:    "bg-red-100 text-red-700",
  AMENDE_GENEREE:     "bg-red-100 text-red-700",
  COMPTE_CREE:        "bg-blue-100 text-blue-700",
  EMPRUNT_CREE:       "bg-primary/10 text-primary",
  RETOUR_CONFIRME:    "bg-green-100 text-green-700",
  RESERVATION_CREEE:  "bg-purple-100 text-purple-700",
  NOUVEAU_LIVRE:      "bg-yellow-100 text-yellow-700",
  RESERVATION_EXPIREE:"bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 20;

const ROLES_CIBLES = [
  { key: "ETUDIANT",       label: "Étudiants" },
  { key: "ENSEIGNANT",     label: "Enseignants" },
  { key: "PUBLIC",         label: "Public" },
  { key: "BIBLIOTHECAIRE", label: "Bibliothécaires" },
];

const TYPES_NOTIF = [
  { key: "NOUVEAU_LIVRE",   label: "Nouveau livre" },
  { key: "RAPPEL_RETOUR",   label: "Rappel retour" },
  { key: "RETARD_CONSTATE", label: "Retard constaté" },
  { key: "INFORMATION",     label: "Information générale" },
];

function HistoriqueCard({ d }: { d: DiffusionGroupee }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-sm text-text-1">{d.sujet}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          d.statut === "ENVOYE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {d.statut === "ENVOYE" ? "Envoyé" : "Planifié"}
        </span>
      </div>
      <p className="text-sm text-text-2 line-clamp-2">{d.message}</p>
      <div className="flex flex-wrap gap-3 text-xs text-text-3">
        <span>👥 {d.nbDestinataires} destinataire(s)</span>
        <span>🏷️ {d.rolesCibles}</span>
        <span>📅 {new Date(d.statut === "PLANIFIE" && d.dateEnvoiProgramme ? d.dateEnvoiProgramme : d.dateEnvoi).toLocaleString("fr-FR")}</span>
        {d.expediteur && <span>✉️ {d.expediteur.prenom} {d.expediteur.nom}</span>}
      </div>
    </div>
  );
}

function NotifCard({ notif, onLire }: { notif: Notification; onLire: (id: number) => void }) {
  const t = useT();
  const typeLabels = t.communication.typeLabels as Record<string, string>;
  return (
    <div className={`flex items-start gap-4 rounded-xl border p-4 transition ${notif.lu ? "border-border bg-white opacity-70" : "border-primary/30 bg-primary/5"}`}>
      <div className={`mt-0.5 rounded-full p-2 ${TYPE_COLORS[notif.type] ?? "bg-gray-100 text-gray-600"}`}>
        <Bell size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[notif.type] ?? "bg-gray-100 text-gray-600"}`}>
            {typeLabels[notif.type] ?? notif.type}
          </span>
          <span className="text-xs text-text-3">{new Date(notif.dateEnvoi).toLocaleString("fr-FR")}</span>
          {!notif.lu && <span className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <p className="mt-1 text-sm text-text-1">{notif.message}</p>
      </div>
      {!notif.lu && (
        <button
          onClick={() => onLire(notif.id)}
          className="shrink-0 rounded border border-border px-2 py-1 text-xs text-text-2 hover:bg-surface-2"
          title={t.communication.marquerLu}
        >
          <CheckCheck size={14} />
        </button>
      )}
    </div>
  );
}

export default function CommunicationPage() {
  const t = useT();
  const [page, setPage] = useState(0);
  const [onglet, setOnglet] = useState<"notifications" | "diffusion" | "historique">("notifications");
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const canManage   = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const { data, isLoading } = useNotifications(utilisateur?.id, page, PAGE_SIZE);
  const lireMutation     = useLireNotification();
  const lireToutMutation = useLireToutesNotifications();

  const [diffSujet, setDiffSujet]   = useState("");
  const [diffMessage, setDiffMessage] = useState("");
  const [diffType, setDiffType]       = useState("NOUVEAU_LIVRE");
  const [diffRoles, setDiffRoles]     = useState<string[]>(["ETUDIANT", "ENSEIGNANT", "PUBLIC"]);
  const [diffDate, setDiffDate]       = useState("");
  const [histPage, setHistPage]       = useState(0);

  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ["historique-diffusions", histPage],
    queryFn: () => notificationsApi.historiqueDiffusions(histPage, 10).then((r) => r.data),
    enabled: onglet === "historique" && canManage,
  });

  const diffusionMutation = useMutation({
    mutationFn: () => notificationsApi.envoyerGroupee({
      roles: diffRoles,
      sujet: diffSujet || undefined,
      message: diffMessage,
      type: diffType,
      dateEnvoiProgramme: diffDate || undefined,
      expediteurId: utilisateur?.id,
    }).then((r) => r.data),
    onSuccess: (data) => {
      if (data.planifie) {
        toast.success("Message planifié avec succès !");
      } else {
        toast.success("Message envoyé à tous les destinataires !");
      }
      setDiffMessage("");
      setDiffSujet("");
      setDiffDate("");
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const toggleRole = (role: string) =>
    setDiffRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);

  const notifications = data?.content ?? [];
  const nonLues = notifications.filter((n) => !n.lu);
  const lues    = notifications.filter((n) => n.lu);
  const total   = data?.totalElements ?? 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.communication.titreComplet}</h1>
          <p className="text-sm text-text-2">
            {total} {total > 1 ? t.communication.totalNotificationsPluriel : t.communication.totalNotifications}
          </p>
        </div>
        {nonLues.length > 0 && onglet === "notifications" && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-white">
              {nonLues.length} {nonLues.length > 1 ? t.communication.nonLuesPluriel : t.communication.nonLues}
            </span>
            <button
              onClick={() => utilisateur?.id && lireToutMutation.mutate(utilisateur.id)}
              disabled={lireToutMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-2 hover:bg-surface disabled:opacity-50"
            >
              <CheckCheck size={14} /> {t.communication.toutMarquerLu}
            </button>
          </div>
        )}
      </div>

      {/* Onglets staff */}
      {canManage && (
        <div className="flex gap-1 rounded-lg border border-border bg-white p-1 w-fit">
          <button
            onClick={() => setOnglet("notifications")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              onglet === "notifications" ? "bg-primary text-white" : "text-text-2 hover:text-text-1"
            }`}
          >
            <Bell size={14} /> Mes notifications
          </button>
          <button
            onClick={() => setOnglet("diffusion")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              onglet === "diffusion" ? "bg-primary text-white" : "text-text-2 hover:text-text-1"
            }`}
          >
            <Users size={14} /> Diffusion groupée
          </button>
          <button
            onClick={() => setOnglet("historique")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              onglet === "historique" ? "bg-primary text-white" : "text-text-2 hover:text-text-1"
            }`}
          >
            <History size={14} /> Historique
          </button>
        </div>
      )}

      {onglet === "diffusion" && canManage && (
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold">Envoyer un message groupé</h2>
            <p className="text-sm text-text-3 mt-0.5">
              Le message sera envoyé en notification interne et par email à tous les utilisateurs des rôles sélectionnés.
            </p>
          </div>

          {/* Destinataires */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-2">Destinataires</label>
            <div className="flex flex-wrap gap-2">
              {ROLES_CIBLES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleRole(key)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    diffRoles.includes(key)
                      ? "border-primary bg-primary text-white"
                      : "border-border text-text-2 hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {diffRoles.length === 0 && (
              <p className="text-xs text-danger">Sélectionnez au moins un groupe</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-2">Type de notification</label>
            <select
              value={diffType}
              onChange={(e) => setDiffType(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {TYPES_NOTIF.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Sujet */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-2">Sujet de l'email</label>
            <input
              type="text"
              value={diffSujet}
              onChange={(e) => setDiffSujet(e.target.value)}
              placeholder="Ex : Fermeture exceptionnelle de la bibliothèque"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-2">Message</label>
            <textarea
              rows={4}
              value={diffMessage}
              onChange={(e) => setDiffMessage(e.target.value)}
              placeholder="Ex : La bibliothèque sera fermée le 25 décembre. Pensez à retourner vos livres avant cette date."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className={`text-xs ${diffMessage.length > 1000 ? "text-danger" : "text-text-3"}`}>
              {diffMessage.length} / 1000 caractères
            </p>
          </div>

          {/* Envoi programmé */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-2 flex items-center gap-1.5">
              <Clock size={14} /> Envoi programmé <span className="text-text-3 font-normal">(optionnel)</span>
            </label>
            <input
              type="datetime-local"
              value={diffDate}
              onChange={(e) => setDiffDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            {diffDate && (
              <p className="text-xs text-yellow-600">⏰ Le message sera envoyé le {new Date(diffDate).toLocaleString("fr-FR")}</p>
            )}
          </div>

          <button
            onClick={() => diffusionMutation.mutate()}
            disabled={!diffMessage.trim() || diffRoles.length === 0 || diffusionMutation.isPending || diffMessage.length > 1000}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
          >
            {diffusionMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Envoi en cours...
              </span>
            ) : (
              <span>{diffDate ? "Planifier l'envoi" : `Envoyer à ${diffRoles.length} groupe(s)`}</span>
            )}
          </button>
        </div>
      )}

      {/* ── Onglet Historique ── */}
      {onglet === "historique" && canManage && (
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><History size={16} /> Historique des diffusions</h2>
          {histLoading ? (
            <div className="flex h-32 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            </div>
          ) : (histData?.content ?? []).length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white text-text-3">
              <History size={28} />
              <p className="text-sm">Aucune diffusion envoyée pour l'instant</p>
            </div>
          ) : (
            <>
              {(histData?.content ?? []).map((d) => <HistoriqueCard key={d.id} d={d} />)}
              {(histData?.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-text-2">Page {histPage + 1} / {histData?.totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setHistPage((p) => Math.max(0, p - 1))} disabled={histPage === 0}
                      className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Précédent</button>
                    <button onClick={() => setHistPage((p) => p + 1)} disabled={histPage >= (histData?.totalPages ?? 1) - 1}
                      className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Suivant</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Onglet Notifications ── */}
      {onglet === "notifications" && (
        isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {nonLues.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Mail size={16} className="text-primary" /> {t.communication.nonLuesTitre} ({nonLues.length})
                </h2>
                {nonLues.map((n) => (
                  <NotifCard key={n.id} notif={n} onLire={(id) => lireMutation.mutate(id)} />
                ))}
              </div>
            )}

            {lues.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 font-semibold text-text-2">
                  <CheckCheck size={16} /> {t.communication.luesTitre} ({lues.length})
                </h2>
                {lues.map((n) => (
                  <NotifCard key={n.id} notif={n} onLire={(id) => lireMutation.mutate(id)} />
                ))}
              </div>
            )}

            {notifications.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white text-text-3">
                <Bell size={32} />
                <p>{t.communication.aucuneNotification}</p>
              </div>
            )}

            {(data?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-text-2">
                  {t.communication.page} {page + 1} / {data?.totalPages} — {data?.totalElements} {t.communication.totalNotificationsPluriel}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
                  >
                    {t.communication.precedent}
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (data?.totalPages ?? 1) - 1}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
                  >
                    {t.communication.suivant}
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
