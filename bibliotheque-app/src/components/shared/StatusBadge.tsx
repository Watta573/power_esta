import { useT } from "@/stores/i18n.store";

const colors: Record<string, string> = {
  EN_COURS:    "bg-blue-100 text-blue-800",
  RETOURNE:    "bg-green-100 text-green-800",
  EN_RETARD:   "bg-red-100 text-red-800",
  EN_ATTENTE:  "bg-yellow-100 text-yellow-800",
  DISPONIBLE:  "bg-emerald-100 text-emerald-800",
  CONFIRMEE:   "bg-blue-100 text-blue-800",
  ANNULEE:     "bg-gray-100 text-gray-600",
  EXPIREE:     "bg-red-100 text-red-800",
  INDISPONIBLE:"bg-orange-100 text-orange-700",
  ACTIF:       "bg-emerald-100 text-emerald-800",
  INACTIF:     "bg-gray-100 text-gray-600",
  SUSPENDU:    "bg-red-100 text-red-800",
};

export default function StatusBadge({ statut, label }: { statut: string; label?: string }) {
  const t = useT();
  const translated = label ?? (t.statuts as Record<string, string>)[statut] ?? statut;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[statut] ?? "bg-surface-2 text-text-2"}`}>
      {translated}
    </span>
  );
}
