import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faPlus, faXmark, faCheck, faUsers } from '@fortawesome/free-solid-svg-icons';
import { usePermissions, useUserPermissions, useAccorderPermission, useRevoquerPermission } from '@/hooks/usePermissions';
import type { Utilisateur } from '@/types';

interface PermissionManagerProps {
  utilisateur: Utilisateur;
  onClose: () => void;
}

export default function PermissionManager({ utilisateur, onClose }: PermissionManagerProps) {
  const [selectedModule, setSelectedModule] = useState<string>('TOUS');
  const [notes, setNotes] = useState('');
  
  const { data: allPermissions = [] } = usePermissions();
  const { data: userPermissions = [] } = useUserPermissions(utilisateur.id);
  const accorderMutation = useAccorderPermission();
  const revoquerMutation = useRevoquerPermission();
  
  const modules = ['TOUS', ...new Set(allPermissions.map(p => p.module))];
  const filteredPermissions = selectedModule === 'TOUS' 
    ? allPermissions 
    : allPermissions.filter(p => p.module === selectedModule);
  
  const handleTogglePermission = (permissionCode: string, hasPermission: boolean) => {
    if (hasPermission) {
      revoquerMutation.mutate({
        utilisateurId: utilisateur.id,
        request: { permissionCode, notes }
      });
    } else {
      accorderMutation.mutate({
        utilisateurId: utilisateur.id,
        request: { permissionCode, notes }
      });
    }
    setNotes('');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faShield} className="text-primary" style={{ fontSize: 20 }} />
            <div>
              <h2 className="font-semibold text-gray-900">Gestion des permissions</h2>
              <p className="text-sm text-gray-600">{utilisateur.prenom} {utilisateur.nom} - {utilisateur.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Filtres par module */}
          <div className="mb-6 flex flex-wrap gap-2">
            {modules.map(module => (
              <button
                key={module}
                onClick={() => setSelectedModule(module)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  selectedModule === module
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
          
          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Raison de la modification..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          
          {/* Liste des permissions */}
          <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Permission</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Module</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPermissions.map(permission => {
                  const hasPermission = userPermissions.includes(permission.code);
                  return (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{permission.nom}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {permission.module}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{permission.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          hasPermission 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {hasPermission ? 'Accordée' : 'Non accordée'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePermission(permission.code, hasPermission)}
                          disabled={accorderMutation.isPending || revoquerMutation.isPending}
                          className={`rounded px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            hasPermission
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <FontAwesomeIcon 
                            icon={hasPermission ? faXmark : faCheck} 
                            className="mr-1" 
                            style={{ fontSize: 10 }} 
                          />
                          {hasPermission ? 'Révoquer' : 'Accorder'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}