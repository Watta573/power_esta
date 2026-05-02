import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, BookOpen, Calendar, User, Hash, Search, X, ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBarcode } from "@fortawesome/free-solid-svg-icons";
import { livresApi } from "@/api/livres.api";
import { useCreerEmprunt } from "@/hooks/useEmprunts";
import { useLivres } from "@/hooks/useLivres";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import BarcodeScanner from "@/components/shared/BarcodeScanner";
import type { Emprunt, Exemplaire, Livre, Utilisateur } from "@/types";
import { useT } from "@/stores/i18n.store";
import { useAuthStore } from "@/stores/auth.store";

const schema = z.object({
  utilisateurId: z.number().int().positive("Utilisateur requis"),
  livreId: z.number().int().min(0),
  exemplaireId: z.number().int().positive("Exemplaire requis"),
});
type FormValues = z.infer<typeof schema>;

// ── Dropdown générique ────────────────────────────────────────────────────────
function SearchDropdown<T>({ label, placeholder, items, selected, onSelect, onClear,
  renderItem, renderSelected, loading, emptyText, disabled, extra }: {
  label: string; placeholder: string; items: T[];
  selected: T | null; onSelect: (item: T) => void; onClear: () => void;
  renderItem: (item: T) => React.ReactNode; renderSelected: (item: T) => React.ReactNode;
  loading?: boolean; emptyText?: string; disabled?: boolean; extra?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = items.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5" ref={ref}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-1">{label}</label>
        {extra}
      </div>
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
          <div className="min-w-0 flex-1">{renderSelected(selected)}</div>
          <button type="button" onClick={() => { onClear(); setSearch(""); }} disabled={disabled}
            className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-text-3 shadow-sm hover:text-danger disabled:opacity-40">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button type="button" onClick={() => !disabled && setOpen((v) => !v)} disabled={disabled}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-white px-4 text-sm text-text-2 transition hover:border-primary/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
            <span>{loading ? "Chargement..." : placeholder}</span>
            <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-white shadow-xl">
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                  <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-3">{emptyText ?? "Aucun résultat"}</p>
                ) : filtered.map((item, i) => (
                  <button key={i} type="button"
                    onClick={() => { onSelect(item); setOpen(false); setSearch(""); }}
                    className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition last:border-0 hover:bg-surface">
                    {renderItem(item)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NouvelEmpruntPage() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefilledLivreId = Number(searchParams.get("livreId") ?? 0);
  const moi       = useAuthStore((s) => s.utilisateur);
  const canManage = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));

  const [scanTarget, setScanTarget]           = useState<"livre" | "exemplaire" | null>(null);
  const [selectedUser, setSelectedUser]       = useState<Utilisateur | null>(null);
  const [selectedLivre, setSelectedLivre]     = useState<Livre | null>(null);
  const [selectedExemplaire, setSelectedExemplaire] = useState<Exemplaire | null>(null);
  const [empruntConfirme, setEmpruntConfirme] = useState<Emprunt | null>(null);

  const { handleSubmit, formState, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { utilisateurId: 0, livreId: prefilledLivreId || 0, exemplaireId: 0 },
  });

  // Non-staff : on set l'utilisateurId automatiquement
  useEffect(() => {
    if (!canManage && moi) {
      setValue("utilisateurId", moi.id, { shouldValidate: true });
    }
  }, [canManage, moi, setValue]);

  const mutation = useCreerEmprunt();

  // Utilisateurs — chargé seulement pour le staff
  const { data: utilisateursPage, isLoading: loadingUsers } = useUtilisateurs(
    { page: 0, size: 50 },
  );

  const { data: livresPage, isLoading: loadingLivres } = useLivres({
    page: 0, size: 100, disponibleSeulement: true,
  });

  const { data: exemplaires, isLoading: loadingExemplaires } = useQuery({
    queryKey: ["exemplaires-emprunt", selectedLivre?.id],
    queryFn: () => livresApi.getExemplaires(selectedLivre!.id).then((r) => r.data),
    enabled: !!selectedLivre,
  });

  const { data: livrePrefilled } = useQuery({
    queryKey: ["livre", prefilledLivreId],
    queryFn: () => livresApi.getById(prefilledLivreId).then((r) => r.data),
    enabled: prefilledLivreId > 0,
  });

  useEffect(() => {
    if (livrePrefilled && !selectedLivre) {
      setSelectedLivre(livrePrefilled);
      setValue("livreId", livrePrefilled.id, { shouldValidate: true });
    }
  }, [livrePrefilled, selectedLivre, setValue]);

  const utilisateurs = useMemo<Utilisateur[]>(() => canManage ? (utilisateursPage?.content ?? []) : [], [utilisateursPage, canManage]);
  const livres = useMemo<Livre[]>(() => livresPage?.content ?? [], [livresPage]);
  const exemplairesDisponibles = useMemo<Exemplaire[]>(
    () => (exemplaires ?? []).filter((e) => e.disponible), [exemplaires]
  );

  const onSubmit = (values: FormValues) => {
    if (!values.exemplaireId || !values.livreId) return;
    mutation.mutate(
      { utilisateurId: values.utilisateurId, exemplaireId: values.exemplaireId },
      { onSuccess: (data) => setEmpruntConfirme(data.data) }
    );
  };

  if (empruntConfirme) {
    return (
      <section className="max-w-2xl space-y-4">
        <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle size={36} className="text-success" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-success">{t.emprunts.empruntEnregistre}</h2>
          <p className="mt-1 text-sm text-text-2">{t.emprunts.confirmationEmail}</p>
          <div className="mt-6 rounded-lg border border-border bg-white p-4 text-left space-y-3">
            {[
              { icon: <BookOpen size={16} className="text-primary shrink-0" />, label: t.emprunts.livre, value: empruntConfirme.livre?.titre },
              { icon: <Hash size={16} className="text-primary shrink-0" />, label: t.emprunts.codeExemplaire, value: empruntConfirme.exemplaire?.codeExemplaire },
              { icon: <User size={16} className="text-primary shrink-0" />, label: t.emprunts.adherent, value: `${empruntConfirme.utilisateur?.prenom} ${empruntConfirme.utilisateur?.nom}` },
              { icon: <Calendar size={16} className="text-primary shrink-0" />, label: t.emprunts.dateEmpruntLabel, value: empruntConfirme.dateEmprunt },
              { icon: <Calendar size={16} className="text-danger shrink-0" />, label: t.emprunts.retourPrevu, value: empruntConfirme.dateRetourPrevue },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                {icon}
                <div>
                  <p className="text-xs text-text-3">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { setEmpruntConfirme(null); setSelectedUser(null); setSelectedLivre(null); setSelectedExemplaire(null); }}
              className="rounded-lg border border-border px-5 py-2 text-sm hover:bg-surface">
              {t.emprunts.nouvelEmpruntBtn}
            </button>
            <button onClick={() => navigate("/emprunts")}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-light">
              {t.emprunts.voirEmprunts}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.emprunts.nouvelEmprunt}</h1>
        <p className="text-sm text-text-2">{t.emprunts.selectionnerUtilisateur}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border bg-white p-6 shadow-sm">

        {/* Utilisateur — staff seulement */}
        {canManage && (
          <div className="space-y-1">
            <SearchDropdown<Utilisateur>
              label={t.emprunts.utilisateur}
              placeholder={t.emprunts.choisirUtilisateur}
              items={utilisateurs}
              selected={selectedUser}
              loading={loadingUsers}
              emptyText="Aucun utilisateur trouvé"
              onSelect={(u) => { setSelectedUser(u); setValue("utilisateurId", u.id, { shouldValidate: true }); }}
              onClear={() => { setSelectedUser(null); setValue("utilisateurId", 0); }}
              renderItem={(u) => (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {u.prenom[0]}{u.nom[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-text-3">{u.identifiant} · {u.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-3">{u.role}</span>
                </>
              )}
              renderSelected={(u) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {u.prenom[0]}{u.nom[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-text-3">{u.identifiant} · {u.role}</p>
                  </div>
                </div>
              )}
            />
            {formState.errors.utilisateurId && (
              <p className="text-xs text-danger">{formState.errors.utilisateurId.message}</p>
            )}
          </div>
        )}

        {/* Livre */}
        <SearchDropdown<Livre>
          label={t.emprunts.livre}
          placeholder={t.emprunts.choisirLivre}
          items={livres}
          selected={selectedLivre}
          loading={loadingLivres}
          emptyText="Aucun livre disponible"
          onSelect={(l) => { setSelectedLivre(l); setSelectedExemplaire(null); setValue("livreId", l.id, { shouldValidate: true }); setValue("exemplaireId", 0); }}
          onClear={() => { setSelectedLivre(null); setSelectedExemplaire(null); setValue("livreId", 0); setValue("exemplaireId", 0); }}
          extra={
            <button type="button" onClick={() => setScanTarget("livre")}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-2 hover:bg-surface">
              <FontAwesomeIcon icon={faBarcode} style={{ fontSize: 12 }} /> {t.emprunts.scannerISBN}
            </button>
          }
          renderItem={(l) => (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <BookOpen size={14} className="text-text-3" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.titre}</p>
                <p className="text-xs text-text-3">{l.auteur} · {l.isbn}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.nombreDisponibles > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {l.nombreDisponibles} {t.emprunts.dispo}
              </span>
            </>
          )}
          renderSelected={(l) => (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen size={16} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{l.titre}</p>
                <p className="text-xs text-text-3">{l.auteur}</p>
              </div>
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                {l.nombreDisponibles} {t.emprunts.dispo}
              </span>
            </div>
          )}
        />

        {/* Exemplaire */}
        <SearchDropdown<Exemplaire>
          label={t.emprunts.exemplaire}
          placeholder={
            !selectedLivre ? t.emprunts.choisirLivreAbord
            : loadingExemplaires ? t.emprunts.chargement
            : exemplairesDisponibles.length === 0 ? t.emprunts.aucunExemplaire
            : t.emprunts.choisirExemplaire
          }
          items={exemplairesDisponibles}
          selected={selectedExemplaire}
          loading={loadingExemplaires}
          disabled={!selectedLivre}
          emptyText={t.emprunts.aucunExemplaire}
          onSelect={(ex) => { setSelectedExemplaire(ex); setValue("exemplaireId", ex.id, { shouldValidate: true }); }}
          onClear={() => { setSelectedExemplaire(null); setValue("exemplaireId", 0); }}
          extra={
            selectedLivre ? (
              <button type="button" onClick={() => setScanTarget("exemplaire")}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-2 hover:bg-surface">
                <FontAwesomeIcon icon={faBarcode} style={{ fontSize: 12 }} /> {t.emprunts.scannerCode}
              </button>
            ) : undefined
          }
          renderItem={(ex) => (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <Hash size={13} className="text-text-3" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{ex.codeExemplaire}</p>
                <p className="text-xs text-text-3">{ex.localisation || "—"} · {ex.etat}</p>
              </div>
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">Disponible</span>
            </>
          )}
          renderSelected={(ex) => (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Hash size={15} className="text-primary" />
              </div>
              <div>
                <p className="font-mono text-sm font-semibold">{ex.codeExemplaire}</p>
                <p className="text-xs text-text-3">{ex.localisation || "—"} · {ex.etat}</p>
              </div>
            </div>
          )}
        />
        {formState.errors.exemplaireId && (
          <p className="text-xs text-danger">{formState.errors.exemplaireId.message}</p>
        )}

        {scanTarget && (
          <BarcodeScanner onClose={() => setScanTarget(null)}
            onResult={(text) => {
              if (scanTarget === "exemplaire") {
                const found = exemplairesDisponibles.find((e) => e.codeExemplaire.toLowerCase() === text.toLowerCase());
                if (found) { setSelectedExemplaire(found); setValue("exemplaireId", found.id, { shouldValidate: true }); }
              }
              setScanTarget(null);
            }}
          />
        )}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={mutation.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-60">
            {mutation.isPending ? t.emprunts.validation : t.emprunts.confirmerEmprunt}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-5 py-2 text-sm hover:bg-surface">
            {t.actions.annuler}
          </button>
        </div>
      </form>
    </section>
  );
}
