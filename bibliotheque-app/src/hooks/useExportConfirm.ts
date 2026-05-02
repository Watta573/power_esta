import { useState, useCallback } from "react";

type ExportType = "pdf" | "excel" | "print";

interface PendingExport {
  type: ExportType;
  document: string;
  action: () => void;
}

export function useExportConfirm() {
  const [pending, setPending] = useState<PendingExport | null>(null);

  const requestExport = useCallback((type: ExportType, document: string, action: () => void) => {
    setPending({ type, document, action });
  }, []);

  const confirm = useCallback(() => {
    pending?.action();
    setPending(null);
  }, [pending]);

  const cancel = useCallback(() => setPending(null), []);

  return { pending, requestExport, confirm, cancel };
}
