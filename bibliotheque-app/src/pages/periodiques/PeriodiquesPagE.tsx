import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPenToSquare, faTrash, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import SearchBar from "@/components/shared/SearchBar";
import { useAuthStore } from "@/stores/auth.store";
import { useT } from "@/stores/i18n.store";
import {
  usePeriodiques, useCreatePeriodique, useUpdatePeriodique, useDeletePeriodique,
  useNumerosPeriodique, useAddNumeroPeriodique, useDeleteNumeroPeriodique,
} from "@/hooks/usePeriodiques";
import type { Periodique } from "@/api/periodiques.api";

const FREQUENCES = ["QUOTIDIEN", "HEBDOMADAIRE", "MENSUEL", "TRIMESTRIEL", "ANNUEL"];

function PeriodiqueForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: Partial<Periodique>;
  onSubmit: (data: { titre: string; issn?: string; editeur?: string; langue?: string; frequence?: string; description?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const t = useT();
  const freqLabels = t.periodiques.freqLabels as Record<string, string>;
  const [form, setForm] = useState<{ titre: string; issn: string; editeur: string; langue: string; frequence: string; description: string }>({
    titre: initial?.titre ?? "", issn: initial?.issn ?? "",
    editeur: initial?.editeur ?? "", langue: initial?.langue ?? "",
    frequence: initial?.frequence ?? "MENSUEL", description: initial?.description ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-2">{t.periodiques.titreLabel}</label>
          <input value={form.titre} onChange={set("titre")} placeholder={t.periodiques.titrePlaceholder}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-2">{t.periodiques.issnLabel}</label>
          <input value={form.issn} onChange={set("issn")} placeholder="XXXX-XXXX"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-2">{t.periodiques.editeurLabel}</label>
          <input value={form.editeur} onChange={set("editeur")}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-2">{t.periodiques.langueLabel}</label>
          <input value={form.langue} onChange={set("langue")} placeholder={t.periodiques.languePlaceholder}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-2">{t.periodiques.frequenceLabel}</label>
          <select value={form.frequence} onChange={set("frequence")}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none">
            {FREQUENCES.map((f) => <option key={f} value={f}>{freqLabels[f] ?? f}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-2">{t.periodiques.descriptionLabel}</label>
        <textarea value={form.description} onChange={set("description")} rows={2}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSubmit(form)} disabled={!form.titre || isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-60">
          {isPending ? t.periodiques.enregistrement : t.periodiques.enregistrer}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:bg-surface">
          {t.periodiques.annuler}
        </button>
      </div>
    </div>
  );
}

function NumeroRow({ periodiqueId, canManage }: { periodiqueId: number; canManage: boolean }) {
  const t = useT();
  const { data } = useNumerosPeriodique(periodiqueId, { size: 50 });
  const addMutation = useAddNumeroPeriodique();
  const deleteMutation = useDeleteNumeroPeriodique();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ numero: "", volume: "", dateParution: "", disponible: true, localisation: "" });

  const numeros = data?.content ?? [];

  return (
    <div className="mt-2 space-y-2 pl-4 border-l-2 border-primary/20">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-2">{numeros.length} {t.periodiques.numerosCount}</p>
        {canManage && (
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10 }} /> {t.periodiques.ajouterNumero}
          </button>
        )}
      </div>

      {showForm && (
        <div className="grid gap-2 rounded-lg border border-border bg-white p-3 sm:grid-cols-3">
          {[
            { key: "numero", label: `${t.periodiques.numero} *`, placeholder: "42" },
            { key: "volume", label: t.periodiques.volume, placeholder: "Vol. 5" },
            { key: "localisation", label: t.periodiques.localisation, placeholder: "Étagère A" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-0.5">
              <label className="text-xs text-text-2">{label}</label>
              <input value={form[key as "numero" | "volume" | "localisation"]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
            </div>
          ))}
          <div className="space-y-0.5">
            <label className="text-xs text-text-2">{t.periodiques.dateParution} *</label>
            <input type="date" value={form.dateParution}
              onChange={(e) => setForm((f) => ({ ...f, dateParution: e.target.value }))}
              className="w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input type="checkbox" id={`dispo-${periodiqueId}`} checked={form.disponible}
              onChange={(e) => setForm((f) => ({ ...f, disponible: e.target.checked }))} />
            <label htmlFor={`dispo-${periodiqueId}`} className="text-xs text-text-2">{t.periodiques.dispo}</label>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                if (!form.numero || !form.dateParution) return;
                addMutation.mutate({ periodiqueId, payload: { periodiqueId, ...form } }, {
                  onSuccess: () => { setShowForm(false); setForm({ numero: "", volume: "", dateParution: "", disponible: true, localisation: "" }); },
                });
              }}
              disabled={addMutation.isPending}
              className="rounded bg-primary px-3 py-1 text-xs text-white hover:bg-primary-light disabled:opacity-60">
              {t.periodiques.ajouter}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-text-3 hover:text-text-1">{t.periodiques.annuler}</button>
          </div>
        </div>
      )}

      {numeros.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-xs">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                {[t.periodiques.volume, t.periodiques.numero, t.periodiques.dateParution, t.periodiques.localisation, t.periodiques.dispo].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
                {canManage && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {numeros.map((n) => (
                <tr key={n.id} className="hover:bg-surface">
                  <td className="px-3 py-2 text-text-2">{n.volume || "—"}</td>
                  <td className="px-3 py-2 font-medium">{n.numero}</td>
                  <td className="px-3 py-2 text-text-2">{n.dateParution}</td>
                  <td className="px-3 py-2 text-text-2">{n.localisation || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${n.disponible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {n.disponible ? t.periodiques.oui : t.periodiques.non}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-3 py-2">
                      <button onClick={() => deleteMutation.mutate(n.id)} disabled={deleteMutation.isPending}
                        className="text-danger hover:opacity-70 disabled:opacity-40">
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PeriodiquesPagE() {
  const t = useT();
  const freqLabels = t.periodiques.freqLabels as Record<string, string>;
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(0);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState<Periodique | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));

  const { data, isLoading } = usePeriodiques({ page, size: 15, q: search || undefined });
  const createMutation = useCreatePeriodique();
  const updateMutation = useUpdatePeriodique();
  const deleteMutation = useDeletePeriodique();

  const periodiques = data?.content ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.periodiques.titre}</h1>
          <p className="text-sm text-text-2">{t.periodiques.sousTitre}</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowForm(true); setEditItem(null); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light">
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13 }} /> {t.periodiques.nouveauPeriodique}
          </button>
        )}
      </div>

      {showForm && (
        <PeriodiqueForm
          initial={editItem ?? undefined}
          isPending={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
          onSubmit={(data) => {
            if (editItem) {
              updateMutation.mutate({ id: editItem.id, payload: data }, { onSuccess: () => { setShowForm(false); setEditItem(null); } });
            } else {
              createMutation.mutate(data, { onSuccess: () => setShowForm(false) });
            }
          }}
        />
      )}

      <div className="w-72">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t.periodiques.titreISBNEditeur} />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : periodiques.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white text-text-3">
          <p>{t.periodiques.aucunTrouve}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {periodiques.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-white shadow-sm">
              <div className="flex items-center gap-4 px-4 py-3">
                <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className="text-text-3 hover:text-primary">
                  <FontAwesomeIcon icon={expandedId === p.id ? faChevronUp : faChevronDown} style={{ fontSize: 13 }} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{p.titre}</p>
                    {p.issn && <span className="font-mono text-xs text-text-3">ISSN {p.issn}</span>}
                    {p.frequence && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {freqLabels[p.frequence] ?? p.frequence}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-2">{p.editeur || "—"} {p.langue ? `· ${p.langue}` : ""}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditItem(p); setShowForm(true); }}
                      className="text-text-3 hover:text-primary">
                      <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: 14 }} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(p.id)} disabled={deleteMutation.isPending}
                      className="text-text-3 hover:text-danger disabled:opacity-40">
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
                    </button>
                  </div>
                )}
              </div>
              {expandedId === p.id && (
                <div className="border-t border-border px-4 pb-4 pt-2">
                  {p.description && <p className="mb-2 text-sm text-text-2">{p.description}</p>}
                  <NumeroRow periodiqueId={p.id} canManage={canManage} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-text-2">{t.periodiques.page} {page + 1} / {data?.totalPages} — {data?.totalElements} {t.periodiques.periodiquesLabel}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.periodiques.precedent}</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages ?? 1) - 1}
              className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40">{t.periodiques.suivant}</button>
          </div>
        </div>
      )}
    </section>
  );
}
