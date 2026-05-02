import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Aucune donnée",
  description = "Aucun élément à afficher pour le moment.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-border bg-white p-10 text-center">
      <Inbox className="mb-3 text-text-3" />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-text-2">{description}</p>
    </div>
  );
}
