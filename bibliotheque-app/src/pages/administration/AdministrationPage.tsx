import { useState } from "react";
import { Shield, Users, Activity, Settings, Download, Plus, Pencil, Trash2, BookOpen, X, Check, ImagePlus, Library, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, type AuditLog } from "@/api/admin.api";
import { utilisateursApi } from "@/api/utilisateurs.api";
import { categoriesApi } from "@/api/categories.api";
import { type LangueDto } from "@/api/langues.api";
import { useLangues, useCreateLangue, useUpdateLangue, useDeleteLangue } from "@/hooks/useLangues";
import { livresApi } from "@/api/livres.api";
import { permissionsApi } from "@/api/permissions.api";
import SearchBar from "@/components/shared/SearchBar";
import { useUiStore } from "@/stores/ui.store";
import type { Categorie, Livre, Role, Utilisateur } from "@/types";
import { useNavigate } from "react-router-dom";
import { useT } from "@/stores/i18n.store";
import PermissionManager from "@/components/shared/PermissionManager";
import { usePermissions, useUserPermissions, useAccorderPermission, useRevoquerPermission } from "@/hooks/usePermissions";

type Onglet = "utilisateurs" | "audit" | "catalogue" | "livres" | "parametres";

const ROLES: Role[] = ["ADMIN", "BIBLIOTHECAIRE", "ETUDIANT", "ENSEIGNANT", "PUBLIC"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  BIBLIOTHECAIRE: "bg-blue-100 text-blue-700",
  ETUDIANT: "bg-green-100 text-green-700",
  ENSEIGNANT: "bg-purple-100 text-purple-700",
  PUBLIC: "bg-gray-100 text-gray-600",
};



function sanitizeText(val: string | null | undefined): string {
  return String(val ?? "").replace(/[<>&"'\r\n\t]/g, " ").substring(0, 300);
}

function exportAuditPDF(logs: AuditLog[]) {
  const rows = logs.map((l) =>
    [
      sanitizeText(l.dateAction?.replace("T", " ").substring(0, 19)),
      sanitizeText(l.email),
      sanitizeText(l.role),
      sanitizeText(l.action),
      sanitizeText(l.details),
      sanitizeText(l.ipAddress),
      sanitizeText(l.statut),
    ].join(" | ")
  ).join("\n");

  const content = `JOURNAL D'ACTIVITÉS - Bibliothèque ESTA\nExporté le ${new Date().toLocaleString("fr-FR")}\n${"=".repeat(100)}\n\nDate/Heure            | Email                | Rôle          | Action                    | Détails                    | IP             | Statut\n${"-".repeat(100)}\n${rows}`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Composant Permissions & Paramètres ──────────────────────────────────────
const ROLE_DEFAULTS: Record<Role, string[]> = {
  ADMIN:          ["Toutes les permissions"],
  BIBLIOTHECAIRE: ["LIVRES_VIEW","LIVRES_CREATE","LIVRES_EDIT","EMPRUNTS_VIEW","EMPRUNTS_VIEW_ALL","EMPRUNTS_CREATE","EMPRUNTS_RETURN","EMPRUNTS_EXTEND","RESERVATIONS_VIEW","RESERVATIONS_VIEW_ALL","RESERVATIONS_CREATE","RESERVATIONS_CANCEL","RESERVATIONS_PROCESS","FINANCES_VIEW","ACQUISITIONS_VIEW","ACQUISITIONS_APPROVE","COMMUNICATION_VIEW","COMMUNICATION_SEND","REPORTS_VIEW"],
  ENSEIGNANT:     ["LIVRES_VIEW","EMPRUNTS_VIEW","EMPRUNTS_HISTORY","RESERVATIONS_VIEW","RESERVATIONS_CREATE","ACQUISITIONS_VIEW","ACQUISITIONS_SUGGEST","COMMUNICATION_VIEW","PROFILE_VIEW","PROFILE_EDIT"],
  ETUDIANT:       ["LIVRES_VIEW","EMPRUNTS_VIEW","EMPRUNTS_HISTORY","RESERVATIONS_VIEW","RESERVATIONS_CREATE","ACQUISITIONS_VIEW","ACQUISITIONS_SUGGEST","COMMUNICATION_VIEW","PROFILE_VIEW","PROFILE_EDIT"],
  PUBLIC:         ["LIVRES_VIEW","RESERVATIONS_VIEW","RESERVATIONS_CREATE","COMMUNICATION_VIEW","PROFILE_VIEW","PROFILE_EDIT"],
};

const MODULE_COLORS: Record<string, string> = {
  ADMINISTRATION: "bg-red-100 text-red-700",
  LIVRES:         "bg-blue-100 text-blue-700",
  EXEMPLAIRES:    "bg-cyan-100 text-cyan-700",
  EMPRUNTS:       "bg-green-100 text-green-700",
  RESERVATIONS:   "bg-purple-100 text-purple-700",
  FINANCES:       "bg-yellow-100 text-yellow-700",
  ACQUISITIONS:   "bg-orange-100 text-orange-700",
  COMMUNICATION:  "bg-pink-100 text-pink-700",
  RAPPORTS:       "bg-indigo-100 text-indigo-700",
  PROFIL:         "bg-gray-100 text-gray-700",
  RELANCES:       "bg-rose-100 text-rose-700",
  SECURITY:       "bg-slate-100 text-slate-700",
};

function PermissionsParametres({ logoUrl, setLogoUrl, ta, onOpenPermissions }: {
  logoUrl: string | null;
  setLogoUrl: (v: string | null) => void;
  ta: any;
  onOpenPermissions: (u: Utilisateur) => void;
}) {
  const [vue, setVue] = useState<"matrice" | "utilisateur" | "parametres">("matrice");
  const [roleSelectionne, setRoleSelectionne] = useState<Role>("ETUDIANT");
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [moduleFiltre, setModuleFiltre] = useState("TOUS");

  const { data: allPermissions = [] } = usePermissions();
  const { data: userPerms = [] } = useUserPermissions(selectedUser?.id);
  const accorder = useAccorderPermission();
  const revoquer = useRevoquerPermission();

  const { data: usersData } = useQuery({
    queryKey: ["users-perm-search", searchUser],
    queryFn: () => utilisateursApi.getAll({ q: searchUser || undefined, size: 8 }).then(r => r.data),
    enabled: vue === "utilisateur",
  });

  const modules = ["TOUS", ...Array.from(new Set(allPermissions.map(p => p.module))).sort()];

  const permsFiltrees = allPermissions.filter(p =>
    moduleFiltre === "TOUS" || p.module === moduleFiltre
  );

  const grouped = permsFiltrees.reduce<Record<string, typeof allPermissions>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const rolePerms = new Set(
    roleSelectionne === "ADMIN"
      ? allPermissions.map(p => p.code)
      : (ROLE_DEFAULTS[roleSelectionne] ?? [])
  );

  return (
    <div className="space-y-4">
      {/* Sous-onglets */}
      <div className="flex gap-1 rounded-lg border border-border bg-white p-1 w-fit">
        {([
          { id: "matrice",     label: "Matrice par rôle",       icon: Shield },
          { id: "utilisateur", label: "Par utilisateur",        icon: Users },
          { id: "parametres",  label: "Paramètres système",    icon: Settings },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setVue(id)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              vue === id ? "bg-primary text-white" : "text-text-2 hover:text-text-1"
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── Vue Matrice par rôle ── */}
      {vue === "matrice" && (
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <h2 className="font-semibold">Permissions par rôle</h2>
              <span className="text-xs text-text-3">{allPermissions.length} permissions au total</span>
            </div>
            <div className="flex gap-1">
              {ROLES.map(r => (
                <button key={r} onClick={() => setRoleSelectionne(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    roleSelectionne === r ? "bg-primary text-white" : `${ROLE_COLORS[r]} hover:opacity-80`
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre module */}
          <div className="flex flex-wrap gap-1 border-b border-border px-4 py-2">
            {modules.map(m => (
              <button key={m} onClick={() => setModuleFiltre(m)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  moduleFiltre === m ? "bg-primary text-white" : "bg-surface-2 text-text-2 hover:bg-surface"
                }`}>
                {m === "TOUS" ? "Tous" : m}
              </button>
            ))}
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {Object.entries(grouped).map(([module, perms]) => (
              <div key={module}>
                <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${MODULE_COLORS[module] ?? "bg-gray-100 text-gray-600"}`}>
                    {module}
                  </span>
                  <span className="text-xs text-text-3">
                    {perms.filter(p => rolePerms.has(p.code)).length} / {perms.length} actives pour {roleSelectionne}
                  </span>
                </div>
                {perms.map(p => {
                  const active = rolePerms.has(p.code);
                  return (
                    <div key={p.id} className={`flex items-center gap-3 border-b border-border/40 px-4 py-2.5 ${
                      active ? "" : "opacity-50"
                    }`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        active ? "bg-success/15 text-success" : "bg-surface-2 text-text-3"
                      }`}>
                        {active ? <Check size={11} /> : <X size={11} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-1">{p.nom}</p>
                        {p.description && <p className="text-xs text-text-3 truncate">{p.description}</p>}
                      </div>
                      <code className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-text-3">{p.code}</code>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-surface-2 px-4 py-2">
            <p className="text-xs text-text-3">
              Cette matrice est en lecture seule. Pour modifier les permissions d'un utilisateur spécifique, utilisez l'onglet <strong>Par utilisateur</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Vue Par utilisateur ── */}
      {vue === "utilisateur" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm text-text-2">Recherchez un utilisateur pour consulter et modifier ses permissions individuelles.</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input value={searchUser} onChange={e => setSearchUser(e.target.value)}
                placeholder="Nom, email, identifiant..."
                className="h-9 w-full rounded-lg border border-border pl-9 pr-3 text-sm focus:border-primary focus:outline-none" />
            </div>
            {searchUser && (
              <div className="mt-2 rounded-lg border border-border bg-white shadow-sm divide-y divide-border">
                {(usersData?.content ?? []).length === 0 ? (
                  <p className="px-4 py-3 text-sm text-text-3">Aucun utilisateur trouvé</p>
                ) : (usersData?.content ?? []).map((u: Utilisateur) => (
                  <button key={u.id} onClick={() => { setSelectedUser(u); setSearchUser(""); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.prenom[0]}{u.nom[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{u.prenom} {u.nom}</p>
                      <p className="text-xs text-text-3">{u.email}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role as Role] ?? ""}`}>{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {selectedUser.prenom[0]}{selectedUser.nom[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-text-1">{selectedUser.prenom} {selectedUser.nom}</p>
                    <p className="text-xs text-text-3">{selectedUser.email} · <span className={`font-medium ${ROLE_COLORS[selectedUser.role as Role]?.split(" ")[1] ?? ""}`}>{selectedUser.role}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-3">
                    <span className="font-semibold text-success">{userPerms.length}</span> permissions actives
                  </span>
                  <button onClick={() => onOpenPermissions(selectedUser)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-light">
                    <Shield size={13} /> Gérer en détail
                  </button>
                  <button onClick={() => setSelectedUser(null)}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm text-text-2 hover:bg-surface">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Aperçu rapide des permissions par module */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {Object.entries(
                  allPermissions.reduce<Record<string, typeof allPermissions>>((acc, p) => {
                    if (!acc[p.module]) acc[p.module] = [];
                    acc[p.module].push(p);
                    return acc;
                  }, {})
                ).map(([module, perms]) => {
                  const activeCount = perms.filter(p => userPerms.includes(p.code)).length;
                  return (
                    <div key={module} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${MODULE_COLORS[module] ?? "bg-gray-100 text-gray-600"}`}>
                          {module}
                        </span>
                        <span className="text-xs text-text-3">{activeCount}/{perms.length}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(activeCount / perms.length) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vue Paramètres système ── */}
      {vue === "parametres" && (
        <div className="space-y-4">
          {/* Logo */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold">{ta.logoLabel}</h2>
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-border bg-surface-2">
                {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <ImagePlus size={24} className="text-text-3" />}
              </div>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/5">
                  <ImagePlus size={15} />
                  {logoUrl ? ta.changerLogo : ta.uploaderLogo}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) { toast.error("Seules les images sont acceptées."); return; }
                    if (file.size > 2 * 1024 * 1024) { toast.error("Image trop lourde. Maximum 2 Mo."); return; }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const result = ev.target?.result as string;
                      if (result && /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(result)) setLogoUrl(result);
                      else toast.error("Format non supporté.");
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {logoUrl && (
                  <button onClick={() => setLogoUrl(null)}
                    className="flex items-center gap-2 rounded-lg border border-danger px-4 py-2 text-sm text-danger hover:bg-danger/5">
                    <X size={14} /> {ta.supprimerLogo}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paramètres établissement */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold">{ta.parametresEtablissement}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {ta.parametresSysteme.map(({ label, value }: { label: string; value: string }) => (
                <div key={label} className="space-y-1">
                  <label className="text-sm font-medium text-text-2">{label}</label>
                  <input defaultValue={value}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              ))}
            </div>
            <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light">
              {ta.enregistrerParametres}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdministrationPage() {
  const t = useT();
  const ta = t.administration;
  const [onglet, setOnglet] = useState<Onglet>("utilisateurs");
  const [searchUser, setSearchUser] = useState("");
  const [searchAudit, setSearchAudit] = useState("");
  const [searchLivres, setSearchLivres] = useState("");
  const [pageLivres, setPageLivres] = useState(0);
  const [pageUser, setPageUser] = useState(0);
  const [pageAudit, setPageAudit] = useState(0);
  const navigate = useNavigate();
  const [catForm, setCatForm] = useState<{ nom: string; couleur: string } | null>(null);
  const [editingCat, setEditingCat] = useState<Categorie | null>(null);
  const [langueForm, setLangueForm] = useState<string | null>(null);
  const [editingLangue, setEditingLangue] = useState<LangueDto | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<Utilisateur | null>(null);
  const { logoUrl, setLogoUrl } = useUiStore();
  const queryClient = useQueryClient();

  const { data: utilisateurs, isLoading: loadingUsers } = useQuery({
    queryKey: ["utilisateurs-admin", pageUser, searchUser],
    queryFn: () => utilisateursApi.getAll({ page: pageUser, size: 15, q: searchUser || undefined }).then((r) => r.data),
  });

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
    enabled: onglet === "catalogue",
  });

  const createCatMutation = useMutation({
    mutationFn: (data: { nom: string; couleur: string }) => categoriesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); setCatForm(null); toast.success("Catégorie créée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? e?.message ?? "Erreur"),
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nom: string; couleur: string } }) => categoriesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); setEditingCat(null); toast.success("Catégorie modifiée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? e?.message ?? "Erreur"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); toast.success("Catégorie supprimée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? e?.message ?? "Impossible de supprimer"),
  });

  const { data: langues, isLoading: loadingLangues } = useLangues();
  const createLangueMutation = useCreateLangue();
  const updateLangueMutation = useUpdateLangue();
  const deleteLangueMutation = useDeleteLangue();

  const { data: auditData, isLoading: loadingAudit } = useQuery({
    queryKey: ["audit", pageAudit, searchAudit],
    queryFn: () => adminApi.getAudit({ page: pageAudit, size: 20, q: searchAudit || undefined }).then((r) => r.data),
    enabled: onglet === "audit",
  });

  const { data: livresData, isLoading: loadingLivres } = useQuery({
    queryKey: ["livres-admin", pageLivres, searchLivres],
    queryFn: () => livresApi.getAll({ page: pageLivres, size: 15, q: searchLivres || undefined }).then((r) => r.data),
    enabled: onglet === "livres",
  });

  const deleteLivreMutation = useMutation({
    mutationFn: (id: number) => livresApi.delete(id),
    onSuccess: () => { queryClient.removeQueries({ queryKey: ["livres"] }); toast.success("Livre supprimé"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Impossible de supprimer"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.changerRole(id, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["utilisateurs-admin"] }); toast.success("Rôle mis à jour"); },
    onError: () => toast.error("Erreur lors du changement de rôle"),
  });

  const activerMutation = useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => adminApi.activer(id, actif),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["utilisateurs-admin"] }); toast.success("Statut mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{ta.titreComplet}</h1>
        <p className="text-sm text-text-2">{ta.sousTitre}</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "utilisateurs", label: ta.utilisateursRoles, icon: Users },
          { id: "audit", label: ta.journalActivites, icon: Activity },
          { id: "catalogue", label: ta.categoriesLangues, icon: BookOpen },
          { id: "livres", label: ta.gestionLivres, icon: Library },
          { id: "parametres", label: ta.permissionsParametres, icon: Settings },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${onglet === id ? "border-primary text-primary" : "border-transparent text-text-2 hover:text-text-1"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ===== UTILISATEURS ===== */}
      {onglet === "utilisateurs" && (
        <div className="space-y-4">
          <div className="w-72">
            <SearchBar value={searchUser} onChange={(v) => { setSearchUser(v); setPageUser(0); }} placeholder={ta.nomEmailId} />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {[ta.utilisateur, ta.email, ta.role, ta.statut, ta.emprunts, ta.retards, ta.inscritLe, ta.actions].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingUsers ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-text-3">{ta.chargement}</td></tr>
                ) : (utilisateurs?.content ?? []).map((u: Utilisateur) => (
                  <tr key={u.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                          {u.prenom[0]}{u.nom[0]}
                        </div>
                        <div>
                          <p className="font-medium">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-text-3">{u.identifiant}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-2 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        disabled={roleMutation.isPending}
                        className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium cursor-pointer ${ROLE_COLORS[u.role]}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.actif ? ta.actif : ta.inactif}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{u.nombreEmpruntsEnCours}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={u.nombreRetards > 0 ? "font-bold text-danger" : ""}>{u.nombreRetards}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-2">{u.dateInscription}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => activerMutation.mutate({ id: u.id, actif: !u.actif })}
                          disabled={activerMutation.isPending}
                          className={`rounded border px-2 py-1 text-xs disabled:opacity-50 ${u.actif ? "border-danger text-danger hover:bg-danger/10" : "border-success text-success hover:bg-success/10"}`}
                        >
                          {u.actif ? ta.desactiver : ta.activer}
                        </button>
                        <button
                          onClick={() => setSelectedUserForPermissions(u)}
                          className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10"
                          title="Gérer les permissions"
                        >
                          <Shield size={12} className="mr-1" />
                          Permissions
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(utilisateurs?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm text-text-2">{utilisateurs?.totalElements} utilisateurs</span>
                <div className="flex gap-2">
                  <button onClick={() => setPageUser((p) => Math.max(0, p - 1))} disabled={pageUser === 0}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{ta.precedent}</button>
                  <button onClick={() => setPageUser((p) => p + 1)} disabled={pageUser >= (utilisateurs?.totalPages ?? 1) - 1}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{ta.suivant}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CATALOGUE ===== */}
      {onglet === "catalogue" && (
        <div className="space-y-6">
          {/* Catégories */}
          <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                <h2 className="font-semibold">{ta.categoriesLivres}</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{categories?.length ?? 0}</span>
              </div>
              <button
                onClick={() => { setCatForm({ nom: "", couleur: "#6366f1" }); setEditingCat(null); }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-light"
              >
                <Plus size={14} /> {ta.nouvelleCategorie}
              </button>
            </div>

            {/* Formulaire inline */}
            {catForm && (
              <div className="border-b border-border bg-blue-50/50 px-4 py-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingCat) {
                      updateCatMutation.mutate({ id: editingCat.id, data: catForm });
                    } else {
                      createCatMutation.mutate(catForm);
                    }
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    value={catForm.nom}
                    onChange={(e) => setCatForm({ ...catForm, nom: e.target.value })}
                    placeholder={ta.nomCategorie}
                    required
                    className="h-9 flex-1 rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-2">{ta.couleur}</label>
                    <input
                      type="color"
                      value={catForm.couleur}
                      onChange={(e) => setCatForm({ ...catForm, couleur: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border border-border"
                    />
                  </div>
                  <button type="submit" disabled={createCatMutation.isPending || updateCatMutation.isPending}
                    className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    <Check size={14} /> {editingCat ? ta.modifier : ta.ajouter}
                  </button>
                  <button type="button" onClick={() => { setCatForm(null); setEditingCat(null); }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">
                    <X size={14} />
                  </button>
                </form>
              </div>
            )}

            <div className="divide-y divide-border">
              {loadingCats ? (
                <p className="px-4 py-6 text-center text-sm text-text-3">{ta.chargement}</p>
              ) : (categories ?? []).length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-3">{ta.aucuneCategorie}</p>
              ) : (categories ?? []).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: cat.couleur ?? "#6366f1" }} />
                    <span className="font-medium">{cat.nom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingCat(cat); setCatForm({ nom: cat.nom, couleur: cat.couleur ?? "#6366f1" }); }}
                      className="rounded p-1.5 text-text-2 hover:bg-surface-2 hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteCatMutation.mutate(cat.id)}
                      disabled={deleteCatMutation.isPending}
                      className="rounded p-1.5 text-text-2 hover:bg-red-50 hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Langues */}
          <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                <h2 className="font-semibold">{ta.languesDisponibles}</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{langues?.length ?? 0}</span>
              </div>
              <button
                onClick={() => { setLangueForm(""); setEditingLangue(null); }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-light"
              >
                <Plus size={14} /> {ta.nouvelleLangue}
              </button>
            </div>

            {/* Formulaire inline langue */}
            {langueForm !== null && (
              <div className="border-b border-border bg-blue-50/50 px-4 py-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!langueForm.trim()) return;
                    if (editingLangue) {
                      updateLangueMutation.mutate({ id: editingLangue.id, nom: langueForm }, {
                        onSuccess: () => { setEditingLangue(null); setLangueForm(null); },
                      });
                    } else {
                      createLangueMutation.mutate(langueForm, {
                        onSuccess: () => setLangueForm(null),
                      });
                    }
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    value={langueForm}
                    onChange={(e) => setLangueForm(e.target.value)}
                    placeholder={ta.nomLangue}
                    required
                    autoFocus
                    className="h-9 flex-1 rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <button type="submit"
                    disabled={createLangueMutation.isPending || updateLangueMutation.isPending}
                    className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    <Check size={14} /> {editingLangue ? ta.modifier : ta.ajouter}
                  </button>
                  <button type="button"
                    onClick={() => { setLangueForm(null); setEditingLangue(null); }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">
                    <X size={14} />
                  </button>
                </form>
              </div>
            )}

            <div className="divide-y divide-border">
              {loadingLangues ? (
                <p className="px-4 py-6 text-center text-sm text-text-3">{ta.chargement}</p>
              ) : (langues ?? []).length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-3">{ta.aucuneLangue}</p>
              ) : (langues ?? []).map((langue) => (
                <div key={langue.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface">
                  <span className="font-medium">{langue.nom}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingLangue(langue); setLangueForm(langue.nom); }}
                      className="rounded p-1.5 text-text-2 hover:bg-surface-2 hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteLangueMutation.mutate(langue.id)}
                      disabled={deleteLangueMutation.isPending}
                      className="rounded p-1.5 text-text-2 hover:bg-red-50 hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== LIVRES ===== */}
      {onglet === "livres" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-72">
              <SearchBar value={searchLivres} onChange={(v) => { setSearchLivres(v); setPageLivres(0); }} placeholder={ta.titreAuteurISBN} />
            </div>
            <button
              onClick={() => navigate("/admin/livres/nouveau")}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-light"
            >
              <Plus size={14} /> {ta.nouveauLivre}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {[ta.titreCol, ta.auteur, ta.isbn, ta.categorie, ta.exemplaires, ta.disponibles, ta.actions].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingLivres ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{ta.chargement}</td></tr>
                ) : (livresData?.content ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{ta.aucunLivre}</td></tr>
                ) : (livresData?.content ?? []).map((livre: Livre) => (
                  <tr key={livre.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{livre.titre}</td>
                    <td className="px-4 py-3 text-text-2">{livre.auteur}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-2">{livre.isbn}</td>
                    <td className="px-4 py-3">
                      {livre.categorie && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: livre.categorie.couleur + "20", color: livre.categorie.couleur }}>
                          {livre.categorie.nom}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{livre.nombreExemplaires}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={livre.nombreDisponibles > 0 ? "text-success font-medium" : "text-danger"}>
                        {livre.nombreDisponibles}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/livres/${livre.id}/modifier`)}
                          className="rounded p-1.5 text-text-2 hover:bg-surface-2 hover:text-primary"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Supprimer "${livre.titre}" ?`)) deleteLivreMutation.mutate(livre.id); }}
                          disabled={deleteLivreMutation.isPending}
                          className="rounded p-1.5 text-text-2 hover:bg-red-50 hover:text-danger disabled:opacity-40"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(livresData?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm text-text-2">{livresData?.totalElements} {ta.livres}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPageLivres((p) => Math.max(0, p - 1))} disabled={pageLivres === 0}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{ta.precedent}</button>
                  <button onClick={() => setPageLivres((p) => p + 1)} disabled={pageLivres >= (livresData?.totalPages ?? 1) - 1}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{ta.suivant}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== AUDIT ===== */}
      {onglet === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-72">
              <SearchBar value={searchAudit} onChange={(v) => { setSearchAudit(v); setPageAudit(0); }} placeholder={ta.emailAction} />
            </div>
            <button
              onClick={() => auditData && exportAuditPDF(auditData.content)}
              disabled={!auditData?.content?.length}
              className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5 disabled:opacity-40"
            >
              <Download size={15} /> {ta.exporterPDF}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {[ta.dateHeure, ta.utilisateur, ta.role, "Action", "Détails", "IP", ta.statut].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingAudit ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{ta.chargement}</td></tr>
                ) : (auditData?.content ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">{ta.aucuneActivite}</td></tr>
                ) : (auditData?.content ?? []).map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-surface">
                    <td className="px-4 py-3 text-xs font-mono text-text-2 whitespace-nowrap">
                      {log.dateAction?.replace("T", " ").substring(0, 19)}
                    </td>
                    <td className="px-4 py-3 text-xs">{log.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[log.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-text-2 max-w-xs truncate">{log.details}</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-3">{log.ipAddress}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.statut === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {log.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(auditData?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm text-text-2">{auditData?.totalElements} {ta.entrees}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPageAudit((p) => Math.max(0, p - 1))} disabled={pageAudit === 0}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{ta.precedent}</button>
                  <button onClick={() => setPageAudit((p) => p + 1)} disabled={pageAudit >= (auditData?.totalPages ?? 1) - 1}
                    className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{ta.suivant}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PERMISSIONS ===== */}
      {onglet === "parametres" && (
        <PermissionsParametres
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          ta={ta}
          onOpenPermissions={(u) => setSelectedUserForPermissions(u)}
        />
      )}
      
      {/* Modal de gestion des permissions */}
      {selectedUserForPermissions && (
        <PermissionManager
          utilisateur={selectedUserForPermissions}
          onClose={() => setSelectedUserForPermissions(null)}
        />
      )}
    </section>
  );
}
