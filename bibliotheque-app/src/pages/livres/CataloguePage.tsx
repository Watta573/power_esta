import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faFilter, faTableCellsLarge, faList, faPlus, faXmark, faHeart } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DataTable from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SearchBar from "@/components/shared/SearchBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { useLivres } from "@/hooks/useLivres";
import { useCategories } from "@/hooks/useCategories";
import { useAuthStore } from "@/stores/auth.store";
import { useT } from "@/stores/i18n.store";
import { reservationsApi } from "@/api/reservations.api";
import { languesApi } from "@/api/langues.api";
import { couvertureUrl } from "@/lib/imageUrl";
import { useWishlist, useToggleWishlist } from "@/hooks/useEspaceMembre";
import type { ColumnDef } from "@tanstack/react-table";
import type { Livre } from "@/types";

type ViewMode = "grid" | "list";

export default function CataloguePage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [langue, setLangue] = useState("");
  const [categorieId, setCategorieId] = useState<number | undefined>(undefined);
  const [auteur, setAuteur] = useState("");
  const [anneeMin, setAnneeMin] = useState("");
  const [anneeMax, setAnneeMax] = useState("");
  const [disponibleSeulement, setDisponibleSeulement] = useState(false);
  const [page, setPage] = useState(0);
  const hasRole = useAuthStore((state) => state.hasRole);
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const canManage = hasRole(["ADMIN", "BIBLIOTHECAIRE"]);
  const canWishlist = hasRole(["ETUDIANT", "ENSEIGNANT", "PUBLIC"]);
  const navigate = useNavigate();
  const t = useT();
  const queryClient = useQueryClient();
  const toggleWishlist = useToggleWishlist();
  const { data: wishlistData } = useWishlist(canWishlist ? utilisateur?.id : undefined);
  const wishlistIds = new Set((wishlistData ?? []).map((w) => w.livre.id));

  function resetFiltres() {
    setLangue(""); setCategorieId(undefined); setAuteur("");
    setAnneeMin(""); setAnneeMax(""); setDisponibleSeulement(false); setPage(0);
  }

  const reserverMutation = useMutation({
    mutationFn: (livreId: number) => reservationsApi.creer({ utilisateurId: utilisateur!.id, livreId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reservations"] }); toast.success("Réservation créée avec succès"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur lors de la réservation"),
  });

  const { data: langues } = useQuery({
    queryKey: ["langues"],
    queryFn: () => languesApi.getAll().then((r) => r.data),
  });

  const { data: categories } = useCategories();

  const { data, isLoading } = useLivres({
    page,
    size: 12,
    q: search || undefined,
    langue: langue || undefined,
    disponibleSeulement,
    categorieId,
    auteur: auteur || undefined,
    anneeMin: anneeMin ? Number(anneeMin) : undefined,
    anneeMax: anneeMax ? Number(anneeMax) : undefined,
  });

  const columns = useMemo<Array<ColumnDef<Livre>>>(
    () => [
      { header: t.livres.titreCol, accessorKey: "titre" },
      { header: t.livres.auteur, accessorKey: "auteur" },
      { header: t.livres.categorie, accessorFn: (row) => row.categorie?.nom ?? "-" },
      {
        header: t.livres.disponibilite,
        cell: ({ row }) => (
          <StatusBadge
            statut={row.original.nombreDisponibles > 0 ? "DISPONIBLE" : "INDISPONIBLE"}
            label={row.original.nombreDisponibles > 0 ? t.livres.disponible : t.livres.indisponible}
          />
        ),
      },
      {
        header: t.livres.actions,
        cell: ({ row }) => (
          <Link to={`/livres/${row.original.id}`} className="text-primary hover:underline">
            {t.livres.details}
          </Link>
        ),
      },
    ],
    [t],
  );

  const livres = data?.content ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder={t.livres.titreAuteurISBN} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md border px-3 py-2 ${viewMode === "grid" ? "border-primary bg-primary/10 text-primary" : "border-border bg-white"}`}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} style={{ fontSize: 16 }} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md border px-3 py-2 ${viewMode === "list" ? "border-primary bg-primary/10 text-primary" : "border-border bg-white"}`}
          >
            <FontAwesomeIcon icon={faList} style={{ fontSize: 16 }} />
          </button>
          {canManage && (
            <Link to="/admin/livres/nouveau" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white">
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: 16 }} />
              {t.livres.ajouterLivre}
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3 rounded-md border border-border bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 font-medium">
              <FontAwesomeIcon icon={faFilter} style={{ fontSize: 16 }} /> {t.livres.filtres}
            </h3>
            <button onClick={resetFiltres} className="text-xs text-text-3 hover:text-danger flex items-center gap-1">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} /> {t.livres.reinitialiser}
            </button>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-text-2">{t.livres.categorie}</label>
            <select
              value={categorieId ?? ""}
              onChange={(e) => { setCategorieId(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
              className="h-10 w-full rounded-md border border-border px-2 text-sm"
            >
              <option value="">{t.livres.toutes}</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-text-2">{t.livres.langue}</label>
            <select
              value={langue}
              onChange={(e) => { setLangue(e.target.value); setPage(0); }}
              className="h-10 w-full rounded-md border border-border px-2 text-sm"
            >
              <option value="">{t.livres.toutes}</option>
              {(langues ?? []).map((l: { id: number; nom: string }) => (
                <option key={l.id} value={l.nom}>{l.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-text-2">{t.livres.auteur}</label>
            <input
              value={auteur}
              onChange={(e) => { setAuteur(e.target.value); setPage(0); }}
              placeholder={t.livres.nomAuteur}
              className="h-10 w-full rounded-md border border-border px-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-sm text-text-2">{t.livres.anneeMin}</label>
              <input
                type="number"
                value={anneeMin}
                onChange={(e) => { setAnneeMin(e.target.value); setPage(0); }}
                placeholder="ex: 2000"
                className="h-10 w-full rounded-md border border-border px-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-text-2">{t.livres.anneeMax}</label>
              <input
                type="number"
                value={anneeMax}
                onChange={(e) => { setAnneeMax(e.target.value); setPage(0); }}
                placeholder="ex: 2024"
                className="h-10 w-full rounded-md border border-border px-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disponibleSeulement}
              onChange={(e) => { setDisponibleSeulement(e.target.checked); setPage(0); }}
            />
            {t.livres.disponiblesSeulement}
          </label>
        </aside>

        <div>
          {viewMode === "grid" ? (
            livres.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {livres.map((livre) => (
                  <article key={livre.id} className="rounded-md border border-border bg-white p-4 shadow-soft">
                    <div className="mb-3 grid h-40 place-items-center overflow-hidden rounded-md bg-surface-2 text-text-3">
                      {livre.couverture ? (
                        <img src={couvertureUrl(livre.couverture)!} alt={livre.titre} className="h-full w-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: 24 }} />
                      )}
                    </div>
                    <h4 className="line-clamp-2 font-heading text-lg">{livre.titre}</h4>
                    <p className="mt-1 text-sm text-text-2">{livre.auteur}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <StatusBadge
                        statut={livre.nombreDisponibles > 0 ? "DISPONIBLE" : "INDISPONIBLE"}
                        label={livre.nombreDisponibles > 0 ? t.livres.disponible : t.livres.indisponible}
                      />
                      <span className="text-xs text-text-2">{livre.nombreDisponibles} {t.emprunts.dispo}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link to={`/livres/${livre.id}`} className="rounded-md border border-border px-3 py-1 text-sm">
                        {t.livres.details}
                      </Link>
                      {canManage ? (
                        <Link
                          to={`/emprunts/nouveau?livreId=${livre.id}`}
                          className="rounded-md bg-primary px-3 py-1 text-sm text-white"
                        >
                          {t.livres.preter}
                        </Link>
                      ) : (
                        <button
                          onClick={() => reserverMutation.mutate(livre.id)}
                          disabled={reserverMutation.isPending}
                          className="rounded-md bg-primary px-3 py-1 text-sm text-white disabled:opacity-60"
                        >
                          {t.livres.reserver}
                        </button>
                      )}
                      {canWishlist && utilisateur && (
                        <button
                          onClick={() => toggleWishlist.mutate({ livreId: livre.id, utilisateurId: utilisateur.id, inWishlist: wishlistIds.has(livre.id) })}
                          disabled={toggleWishlist.isPending}
                          title={wishlistIds.has(livre.id) ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
                          className={`rounded-md border px-2 py-1 text-sm transition-colors disabled:opacity-50 ${
                            wishlistIds.has(livre.id) ? "border-red-300 bg-red-50 text-red-500" : "border-border text-text-3 hover:text-red-400"
                          }`}
                        >
                          <FontAwesomeIcon icon={faHeart} style={{ fontSize: 13 }} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title={t.livres.aucunLivreTrouve} description={t.livres.ajusterFiltres} />
            )
          ) : (
            <DataTable
              columns={columns}
              data={livres}
              isLoading={isLoading}
              pagination={{ pageIndex: data?.number ?? 0, pageSize: data?.size ?? 12, totalPages: data?.totalPages ?? 1 }}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </section>
  );
}
