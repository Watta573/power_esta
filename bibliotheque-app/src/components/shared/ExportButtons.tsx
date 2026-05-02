import { Download } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

interface ExportButtonsProps {
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export default function ExportButtons({
  isExportingPdf,
  isExportingExcel,
  onExportPdf,
  onExportExcel,
}: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onExportPdf} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-white">
        {isExportingPdf ? <LoadingSpinner className="h-4 w-4" /> : <Download size={14} />}
        Export PDF
      </button>
      <button
        onClick={onExportExcel}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
      >
        {isExportingExcel ? <LoadingSpinner className="h-4 w-4" /> : <Download size={14} />}
        Export Excel
      </button>
    </div>
  );
}
