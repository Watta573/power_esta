import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, Key, Lock, BookOpen, AlertTriangle, Pencil, X, Check, Printer, ShieldCheck, QrCode, Bell, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { utilisateursApi } from "@/api/utilisateurs.api";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { imprimerRecuAbonnement, imprimerRecuCotisation } from "@/utils/exportPDF";
import { useMyCotisations } from "@/hooks/useCotisations";
import { useT } from "@/stores/i18n.store";
import PermissionDebugger from "@/components/shared/PermissionDebugger";

const profilSchema = z.object({
  nom: z.string().min(2, "Nom trop court"),
  prenom: z.string().min(2, "Prénom trop court"),
  telephone: z.string().regex(/^[0-9]{8,15}$/, "Téléphone invalide").or(z.literal("")),
});

type ProfilForm = z.infer<typeof profilSchema>;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  BIBLIOTHECAIRE: "Bibliothécaire",
  ETUDIANT: "Étudiant",
  ENSEIGNANT: "Enseignant",
  PUBLIC: "Public",
};

export default function ProfilPage() {
  const t = useT();
  const tp = t.profil;
  const { utilisateur, updateUtilisateur } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [totp2faData, setTotp2faData] = useState<{ secret: string; otpAuthUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openPhotoPicker = () => fileInputRef.current?.click();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => utilisateursApi.getMe().then((r) => r.data),
  });

  const { data: prefsNotif } = useQuery({
    queryKey: ["prefs-notif"],
    queryFn: () => utilisateursApi.getPrefsNotif().then((r) => r.data),
  });

  const { data: myCotisations } = useMyCotisations({ size: 5 });

  const prefsNotifMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) => utilisateursApi.updatePrefsNotif(data),
    onSuccess: ({ data }) => queryClient.setQueryData(["prefs-notif"], data),
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfilForm>({
    resolver: zodResolver(profilSchema),
  });

  useEffect(() => {
    if (me) {
      reset({ nom: me.nom, prenom: me.prenom, telephone: me.telephone ?? "" });
    }
  }, [me, reset]);

  const setup2faMutation = useMutation({
    mutationFn: authApi.setup2fa,
    onSuccess: ({ data }) => { setTotp2faData(data); setShow2faSetup(true); },
    onError: () => toast.error("Erreur lors de la configuration 2FA"),
  });

  const activate2faMutation = useMutation({
    mutationFn: (code: string) => authApi.activate2fa(code),
    onSuccess: () => { toast.success("2FA activé avec succès"); setShow2faSetup(false); setTotp2faData(null); setTotpCode(""); },
    onError: () => toast.error("Code invalide"),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => utilisateursApi.uploadPhoto(file),
    onSuccess: ({ data }) => {
      updateUtilisateur(data);
      queryClient.setQueryData(["me"], data);
      toast.success("Photo mise à jour !");
    },
    onError: () => toast.error("Erreur lors de l'upload"),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    photoMutation.mutate(file);
  };

  const mutation = useMutation({
    mutationFn: (values: ProfilForm) =>
      utilisateursApi.updateMe({ nom: values.nom, prenom: values.prenom, telephone: values.telephone }),
    onSuccess: ({ data }) => {
      updateUtilisateur(data);
      queryClient.setQueryData(["me"], data);
      toast.success("Profil mis à jour");
      setEditing(false);
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const profile = me ?? utilisateur;

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

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-gray-900">{tp.monProfil}</h1>

      {/* Carte identité */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <label className="relative cursor-pointer group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="relative h-16 w-16 rounded-full overflow-hidden">
              {(photoPreview ?? profile?.photo) ? (
                <img
                  src={photoPreview ?? profile?.photo!}
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white">
                  {profile?.prenom?.[0]?.toUpperCase()}{profile?.nom?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {photoMutation.isPending
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Pencil size={14} className="text-white" />}
              </div>
            </div>
          </label>
          <div className="space-y-3">
            <div>
              <p className="text-xl font-semibold text-gray-900">{profile?.prenom} {profile?.nom}</p>
              <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
              </span>
            </div>
            <button
              type="button"
              onClick={openPhotoPicker}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Importer depuis la galerie
            </button>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={14} /> {tp.modifier}
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{tp.nom}</label>
                <input
                  {...register("nom")}
                  className={`w-full rounded-lg border ${errors.nom ? "border-red-300" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.nom && <p className="text-xs text-red-600">{errors.nom.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{tp.prenom}</label>
                <input
                  {...register("prenom")}
                  className={`w-full rounded-lg border ${errors.prenom ? "border-red-300" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.prenom && <p className="text-xs text-red-600">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">{tp.telephone}</label>
                <input
                  {...register("telephone")}
                  className={`w-full rounded-lg border ${errors.telephone ? "border-red-300" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.telephone && <p className="text-xs text-red-600">{errors.telephone.message}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Check size={14} /> {mutation.isPending ? tp.enregistrement : tp.enregistrer}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); reset(); }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <X size={14} /> {tp.annuler}
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={<User size={15} />} label={tp.identifiant} value={profile?.identifiant} />
            <InfoRow icon={<Mail size={15} />} label={tp.email} value={profile?.email} />
            <InfoRow icon={<Phone size={15} />} label={tp.telephone} value={profile?.telephone || "—"} />
            <InfoRow icon={<Key size={15} />} label={tp.membreDepuis} value={profile?.dateInscription ?? "—"} />
          </dl>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={<BookOpen size={18} className="text-blue-600" />} label={tp.empruntsEnCours} value={profile?.nombreEmpruntsEnCours ?? 0} />
        <StatBox icon={<AlertTriangle size={18} className="text-orange-500" />} label={tp.retards} value={profile?.nombreRetards ?? 0} color={profile?.nombreRetards ? "text-orange-600" : undefined} />
        <StatBox icon={<Lock size={18} className="text-gray-500" />} label={tp.statutCompte} value={profile?.actif ? tp.actif : tp.inactif} color={profile?.actif ? "text-green-600" : "text-red-600"} />
      </div>

      {/* Sécurité & Documents */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">{tp.securiteDocuments}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Lock size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tp.motDePasse}</p>
                <p className="text-xs text-gray-500">{tp.motDePasseDesc}</p>
              </div>
            </div>
            <Link to="/change-password"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {tp.modifier}
            </Link>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <ShieldCheck size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tp.twoFa}</p>
                <p className="text-xs text-gray-500">{tp.twoFaDesc}</p>
              </div>
            </div>
            <button
              onClick={() => setup2faMutation.mutate()}
              disabled={setup2faMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              <QrCode size={14} /> {tp.configurer}
            </button>
          </div>

          {show2faSetup && totp2faData && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
              <p className="text-sm font-medium text-purple-900">{tp.scan2fa}</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totp2faData.otpAuthUrl)}`}
                alt="QR Code 2FA"
                className="rounded border border-purple-200"
              />
              <p className="text-xs text-purple-700">{tp.entrerManuellement} <code className="font-mono bg-white px-1 rounded">{totp2faData.secret}</code></p>
              <div className="flex gap-2">
                <input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder={tp.codeSixChiffres}
                  maxLength={6}
                  className="w-40 rounded-lg border border-purple-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => activate2faMutation.mutate(totpCode)}
                  disabled={totpCode.length !== 6 || activate2faMutation.isPending}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                  {tp.activer}
                </button>
                <button onClick={() => { setShow2faSetup(false); setTotp2faData(null); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Printer size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tp.recuAbonnement}</p>
                <p className="text-xs text-gray-500">{tp.recuAbonnementDesc}</p>
              </div>
            </div>
            <button
              onClick={() => me && imprimerRecuAbonnement(me, me)}
              disabled={!me}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {tp.telecharger}
            </button>
          </div>

          {/* Section Cotisations */}
          {myCotisations && myCotisations.content.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Mes cotisations</h3>
                <p className="text-xs text-gray-500">Reçus envoyés automatiquement par email</p>
              </div>
              {myCotisations.content.map((cotisation) => (
                <div key={cotisation.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Printer size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Cotisation {cotisation.montant.toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="text-xs text-gray-500">
                        Du {cotisation.dateDebut} au {cotisation.dateFin} - {cotisation.statut}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => imprimerRecuCotisation(cotisation, me ?? null)}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                      <Download size={12} /> Télécharger PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Permissions Debug */}
      <PermissionDebugger />
      
      {/* Notifications */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="font-semibold text-gray-900">{tp.prefsNotif}</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">{tp.prefsNotifDesc}</p>
        <div className="space-y-3">
          {(Object.entries(tp.notifLabels) as [keyof typeof tp.notifLabels, string][]).map(([key, label]) => {
            const desc = tp.notifDescs[key];
            return (
            <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => prefsNotifMutation.mutate({ [key]: !(prefsNotif?.[key] ?? true) })}
                disabled={prefsNotifMutation.isPending}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                  prefsNotif?.[key] ?? true ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  prefsNotif?.[key] ?? true ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
