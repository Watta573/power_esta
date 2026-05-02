import { useT } from "@/stores/i18n.store";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const t = useT();
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page <= 0}
        className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
      >
        {t.pagination.precedent}
      </button>
      <span className="text-sm text-text-2">
        {t.pagination.page} {page + 1} / {Math.max(totalPages, 1)}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
      >
        {t.pagination.suivant}
      </button>
    </div>
  );
}
