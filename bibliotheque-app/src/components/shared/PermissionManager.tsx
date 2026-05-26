import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faXmark, faCheck, faRotateLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import { usePermissions, useUserPermissions, useAccorderPermission, useRevoquerPermission } from '@/hooks/usePermissions';
import type { Utilisateur } from '@/types';

const MODULE_COLORS: Record<string, string> = {
  ADMINISTRATION: 'bg-red-100 text-red-700',
  LIVRES:         'bg-blue-100 text-blue-700',
  EXEMPLAIRES:    'bg-cyan-100 text-cyan-700',
  EMPRUNTS:       'bg-green-100 text-green-700',
  RESERVATIONS:   'bg-purple-100 text-purple-700',
  FINANCES:       'bg-yellow-100 text-yellow-700',
  ACQUISITIONS:   'bg-orange-100 text-orange-700',
  COMMUNICATION:  'bg-pink-100 text-pink-700',
  RAPPORTS:       'bg-indigo-100 text-indigo-700',
  PROFIL:         'bg-gray-100 text-gray-700',
};

export default function PermissionManager({ utilisateur, onClose }: { utilisateur: Utilisateur; onClose: () => void }) {
  const [selectedModule, setSelectedModule] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const { data: allPermissions = [] } = usePermissions();
  const { data: userPermissions = [], isLoading } = useUserPermissions(utilisateur.id);
  const accorder = useAccorderPermission();
  const revoquer = useRevoquerPermission();

  const modules = ['TOUS', ...Array.from(new Set(allPermissions.map(p => p.module))).sort()];

  const filtered = allPermissions.filter(p => {
    const matchModule = selectedModule === 'TOUS' || p.module === selectedModule;
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchModule && matchSearch;
  });

  // Grouper par module pour affichage
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const hasPermission = (code: string) => userPermissions.includes(code);

  const toggle = (code: string, has: boolean) => {
    const fn = has ? revoquer : accorder;
    fn.mutate({ utilisateurId: utilisateur.id, request: { permissionCode: code, notes } }, {
      onSuccess: () => { setNotes(''); setPendingCode(null); },
    });
    setPendingCode(code);
  };

  const accordedCount = allPermissions.filter(p => hasPermission(p.code)).length;
  const totalCount = allPermissions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FontAwesomeIcon icon={faShield} className="text-primary" style={{ fontSize: 18 }} />
            </div>
            <div>
              <h2 className="font-semibold text-text-1">Permissions de {utilisateur.prenom} {utilisateur.nom}</h2>
              <p className="text-xs text-text-3">
                Rôle : <span className="font-medium text-primary">{utilisateur.role}</span>
                {' · '}
                <span className="font-medium text-success">{accordedCount}</span> / {totalCount} permissions actives
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-3 hover:bg-surface-2 hover:text-text-1">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="h-1 w-full bg-surface-2">
          <div className="h-full bg-primary transition-all" style={{ width: `${(accordedCount / totalCount) * 100}%` }} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar modules */}
          <div className="w-44 shrink-0 overflow-y-auto border-r border-border bg-surface p-3 space-y-1">
            {modules.map(m => (
              <button key={m}
                onClick={() => setSelectedModule(m)}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                  selectedModule === m ? 'bg-primary text-white' : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
                }`}
              >
                {m === 'TOUS' ? 'Tous les modules' : m}
              </button>
            ))}
          </div>

          {/* Contenu principal */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Barre outils */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" style={{ fontSize: 12 }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une permission..."
                  className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-sm focus:border-primary focus:outline-none" />
              </div>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Note (optionnel)"
                className="h-8 w-48 rounded-lg border border-border bg-white px-3 text-xs focus:border-primary focus:outline-none" />
            </div>

            {/* Liste permissions */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
              ) : Object.entries(grouped).length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-text-3">Aucune permission trouvée</div>
              ) : Object.entries(grouped).map(([module, perms]) => (
                <div key={module}>
                  <div className="sticky top-0 flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${MODULE_COLORS[module] ?? 'bg-gray-100 text-gray-600'}`}>
                      {module}
                    </span>
                    <span className="text-xs text-text-3">
                      {perms.filter(p => hasPermission(p.code)).length} / {perms.length} actives
                    </span>
                  </div>
                  {perms.map(p => {
                    const has = hasPermission(p.code);
                    const isPending = pendingCode === p.code && (accorder.isPending || revoquer.isPending);
                    return (
                      <div key={p.id} className={`flex items-center gap-3 border-b border-border/50 px-4 py-3 transition hover:bg-surface ${
                        has ? '' : 'opacity-60'
                      }`}>
                        {/* Toggle switch */}
                        <button
                          onClick={() => toggle(p.code, has)}
                          disabled={isPending}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${
                            has ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        >
                          {isPending ? (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                            </span>
                          ) : (
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                              has ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-1">{p.nom}</p>
                          {p.description && <p className="text-xs text-text-3 truncate">{p.description}</p>}
                        </div>

                        <code className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-text-3">
                          {p.code}
                        </code>

                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          has ? 'bg-success/10 text-success' : 'bg-surface-2 text-text-3'
                        }`}>
                          {has ? 'Accordée' : 'Révoquée'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-3">
          <p className="text-xs text-text-3">
            Les permissions du rôle <span className="font-medium text-primary">{utilisateur.role}</span> sont accordées par défaut et ne peuvent pas être révoquées ici.
          </p>
          <button onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface-2">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}