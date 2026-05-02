import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";
import Pagination from "./Pagination";

interface DataTableProps<TData> {
  columns: Array<ColumnDef<TData>>;
  data: TData[];
  isLoading?: boolean;
  pagination?: PaginationState & { totalPages: number };
  onPageChange?: (page: number) => void;
}

export default function DataTable<TData>({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center rounded-md border border-border bg-white p-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-white p-4 shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-2 py-2 text-xs uppercase text-text-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && (
        <Pagination page={pagination.pageIndex} totalPages={pagination.totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}
