import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faFileLines, faFileExcel, faPrint, faCalendar, faClock, faUser } from "@fortawesome/free-solid-svg-icons";
import type { Utilisateur } from "@/types";

type ExportType = "pdf" | "excel" | "print";

interface ExportConfirmModalProps {
  type: ExportType;
  document: string;
  exporteur: Utilisateur | null;
  onConfirm: () => void;
  onClose: () => void;
}

const TYPE_CONFIG = {
  pdf:   { label: "Export PDF",   icon: faFileLines,  color: "text-red-600",   bg: "bg-red-50 border-red-200"     },
  excel: { label: "Export Excel", icon: faFileExcel,  color: "text-green-600", bg: "bg-green-50 border-green-200" },
  print: { label: "Impression",   icon: faPrint,      color: "text-blue-600",  bg: "bg-blue-50 border-blue-200"   },
};

export default function ExportConfirmModal({ type, document, exporteur, onConfirm, onClose }: ExportConfirmModalProps) {
  const now      = new Date();
  const dateStr  = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const heureStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const cfg  = TYPE_CONFIG[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: 16 }} className={cfg.color} />
            <h2 className="font-semibold text-gray-900">{cfg.label}</h2>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 15 }} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-sm text-text-2">
            Document : <span className="font-semibold text-text-1">{document}</span>
          </p>
          <div className={`rounded-xl border p-4 space-y-2.5 ${cfg.bg}`}>
            <div className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={faCalendar} style={{ fontSize: 13 }} className="shrink-0 text-text-3" />
              <span className="text-text-2">Date :</span>
              <span className="font-medium capitalize">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={faClock} style={{ fontSize: 13 }} className="shrink-0 text-text-3" />
              <span className="text-text-2">Heure :</span>
              <span className="font-medium">{heureStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={faUser} style={{ fontSize: 13 }} className="shrink-0 text-text-3" />
              <span className="text-text-2">Par :</span>
              <span className="font-medium">
                {exporteur ? `${exporteur.prenom} ${exporteur.nom} (${exporteur.role})` : "Système"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              type === "pdf" ? "bg-red-600 hover:bg-red-700" :
              type === "excel" ? "bg-green-600 hover:bg-green-700" :
              "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Confirmer
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
