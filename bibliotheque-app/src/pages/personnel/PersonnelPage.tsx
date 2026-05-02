import { useState } from "react";
import { Users, Shield } from "lucide-react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useNavigate } from "react-router-dom";
import { useT } from "@/stores/i18n.store";

type Onglet = "agents" | "roles";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  BIBLIOTHECAIRE: "bg-blue-100 text-blue-700",
  ETUDIANT: "bg-green-100 text-green-700",
  ENSEIGNANT: "bg-purple-100 text-purple-700",
  PUBLIC: "bg-gray-100 text-gray-600",
};

export default function PersonnelPage() {
  const t = useT();
  const roleDescriptions = t.personnel.roleDescriptions as Record<string, string>;
  const [onglet, setOnglet] = useState<Onglet>("agents");
  const navigate = useNavigate();

  const { data: admins } = useUtilisateurs({ role: "ADMIN", size: 50 });
  const { data: bibliothecaires } = useUtilisateurs({ role: "BIBLIOTHECAIRE", size: 50 });

  const personnel = [
    ...(admins?.content ?? []),
    ...(bibliothecaires?.content ?? []),
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.personnel.titreComplet}</h1>
          <p className="text-sm text-text-2">{t.personnel.sousTitre}</p>
        </div>
        <button onClick={() => navigate("/admin/utilisateurs/nouveau")}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light">
          {t.personnel.ajouterAgent}
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {([
          { id: "agents", label: t.personnel.agentsPostes,    icon: Users  },
          { id: "roles",  label: t.personnel.rolesPermissions, icon: Shield },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${onglet === id ? "border-primary text-primary" : "border-transparent text-text-2 hover:text-text-1"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {onglet === "agents" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {personnel.length === 0 ? (
            <p className="col-span-3 py-8 text-center text-text-3">{t.personnel.aucunAgent}</p>
          ) : personnel.map((u) => (
            <div key={u.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                  {u.prenom[0]}{u.nom[0]}
                </div>
                <div>
                  <p className="font-semibold">{u.prenom} {u.nom}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-text-2">{t.personnel.email} : <span className="text-text-1">{u.email}</span></p>
                <p className="text-text-2">{t.personnel.identifiant} : <span className="font-mono text-text-1">{u.identifiant}</span></p>
                {u.telephone && <p className="text-text-2">{t.personnel.telephone} : <span className="text-text-1">{u.telephone}</span></p>}
                <p className="text-text-2">{t.personnel.inscritLe} : <span className="text-text-1">{u.dateInscription}</span></p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {u.actif ? t.personnel.actif : t.personnel.inactif}
                </span>
                <button onClick={() => navigate(`/utilisateurs/${u.id}`)}
                  className="text-xs text-primary hover:underline">
                  {t.personnel.voirDetails}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === "roles" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ROLE_COLORS[role]}`}>{role}</span>
              </div>
              <p className="text-sm text-text-2">{desc}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
