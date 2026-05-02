import { useAuthStore } from '@/stores/auth.store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function PermissionDebugger() {
  const { utilisateur, permissions } = useAuthStore();
  
  if (!utilisateur) return null;
  
  const testPermissions = [
    // Administration
    'ADMIN_USERS_VIEW', 'ADMIN_USERS_CREATE', 'ADMIN_PERMISSIONS_MANAGE',
    
    // Livres
    'LIVRES_VIEW', 'LIVRES_CREATE', 'LIVRES_EDIT', 'LIVRES_DELETE',
    
    // Emprunts
    'EMPRUNTS_VIEW', 'EMPRUNTS_VIEW_ALL', 'EMPRUNTS_CREATE', 'EMPRUNTS_RETURN',
    
    // Finances
    'FINANCES_VIEW', 'FINANCES_AMENDES_VIEW', 'FINANCES_COTISATIONS_CREATE',
    
    // Acquisitions
    'ACQUISITIONS_VIEW', 'ACQUISITIONS_SUGGEST', 'ACQUISITIONS_ORDERS_VIEW', 'ACQUISITIONS_ORDERS_CREATE',
    
    // Rapports
    'REPORTS_VIEW', 'REPORTS_DASHBOARD', 'REPORTS_EXPORT',
    
    // Communication
    'COMMUNICATION_VIEW', 'COMMUNICATION_SEND'
  ];
  
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={faShield} className="text-primary" />
        <h3 className="font-semibold">Permissions de {utilisateur.prenom} {utilisateur.nom}</h3>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {utilisateur.role}
        </span>
      </div>
      
      <div className="grid gap-2 sm:grid-cols-2">
        {testPermissions.map(permission => {
          const hasPermission = permissions.includes(permission);
          return (
            <div key={permission} className="flex items-center justify-between rounded border border-border px-3 py-2">
              <span className="text-sm">{permission}</span>
              <FontAwesomeIcon 
                icon={hasPermission ? faCheck : faXmark}
                className={hasPermission ? 'text-green-600' : 'text-red-600'}
                style={{ fontSize: 14 }}
              />
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Total: {permissions.length} permissions accordées
      </div>
    </div>
  );
}