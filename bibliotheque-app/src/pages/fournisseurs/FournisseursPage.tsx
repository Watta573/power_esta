import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPenToSquare, faTrash, faTruck } from "@fortawesome/free-solid-svg-icons";
import SearchBar from "@/components/shared/SearchBar";
import { useFournisseurs, useCreateFournisseur, useUpdateFournisseur, useDeleteFournisseur } from "@/hooks/useFournisseurs";
import type { Fournisseur } from "@/api/fournisseurs.api";

function FournisseurForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: Partial<Fournisseur>;
  onSubmit: (data: { nom: string; email?: string; telephone?: string; adresse?: string; contactNom?: string; notes?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<{ nom: string; email: string; telephone: string; adresse: string; contactNom: string; notes: string }>({
    nom: initial?.nom ?? "", email: initial?.email ?? "",
    telephone: initial?.telephone ?? "", adresse: initial?.adresse ?? "",
    contactNom: initial?.contactNom ?? "", notes: initial?.notes ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { key: "nom",        label: "Nom",            placeholder: "Nom du fournisseur" },
          { key: "email",      label: "Email",          placeholder: "contact@fournisseur.com" },
          { key: "telephone",  label: "Téléphone",      placeholder: "+225 XX XX XX XX" },
          { key: "contactNom", label: "Contact",        placeholder: "Nom du contact" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium text-text-2">{label}</label>
            <input value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)} placeholder={placeholder}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
        ))}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-text-2">Adresse</label>
          <input value={form.adresse} onChange={set("adresse")} placeholder="Adresse complète"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-text-2">Notes</label>
          <textarea value={form.notes} onChange={set("notes")} rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSubmit(form)} disabled={!form.nom || isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-60">
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function FournisseursPage() {
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(0);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState<Fournisseur | null>(null);

  const { data, isLoading } = useFournisseurs({ page, size: 15, q: search || undefined });
  const createMutation = useCreateFournisseur();
  const updateMutation = useUpdateFournisseur();
  const deleteMutation = useDeleteFournisseur();

  const fournisseurs = data?.content ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Fournisseurs</h1>
          <p className="text-sm text-text-2">Gestion des fournisseurs et historique des commandes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditItem(null); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light">
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13 }} /> Nouveau fournisseur
        </button>
      </div>

      {showForm && (
        <FournisseurForm
          initial={editItem ?? undefined}
          isPending={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
          onSubmit={(data) => {
            if (editItem) {
              updateMutation.mutate({ id: editItem.id, payload: data }, {
                onSuccess: () => { setShowForm(false); setEditItem(null); },
              });
            } else {
              createMutation.mutate(data, { onSuccess: () => setShowForm(false) });
            }
          }}
        />
      )}

      <div className="w-72">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Nom, email..." />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>{["Nom", "Contact", "Email", "Téléphone", "Adresse", "Commandes", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fournisseurs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-3">Aucun fournisseur</td></tr>
              ) : fournisseurs.map((f) => (
                <tr key={f.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <FontAwesomeIcon icon={faTruck} className="text-primary" style={{ fontSize: 13 }} />
                      </div>
                      <span className="font-medium">{f.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-2">{f.contactNom || "—"}</td>
                  <td className="px-4 py-3 text-xs text-text-2">{f.email || "—"}</td>
                  <td className="px-4 py-3 text-text-2">{f.telephone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-text-2 max-w-[160px] truncate">{f.adresse || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {f.nbCommandes}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(f); setShowForm(true); }}
                        className="text-text-3 hover:text-primary">
                        <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: 14 }} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}
                        className="text-text-3 hover:text-danger disabled:opacity-40">
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-text-2">Page {page + 1} / {data?.totalPages} — {data?.totalElements} fournisseurs</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Précédent</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages ?? 1) - 1}
                  className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">Suivant</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
