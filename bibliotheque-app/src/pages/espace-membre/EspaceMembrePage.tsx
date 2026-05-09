import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIdCard, faClockRotateLeft, faTriangleExclamation, faChartPie,
  faHeart, faBell, faBookmark, faPlus, faTrash, faGlobe, faLock,
  faStar, faCheckCircle, faExclamationCircle, faSpinner, faMagnifyingGlass, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useT } from "@/stores/i18n.store";
import {
  useCarteMembre, useHistoriqueEmprunts, useAmendesUtilisateur,
  useStatistiquesPersonnelles, useWishlist, useToggleWishlist,
  useAlertes, useCreerAlerte, useSupprimerAlerte,
  useMesListes, useCreerListe, useSupprimerListe,
  useAjouterLivreListe, useRetirerLivreListe,
} from "@/hooks/useEspaceMembre";
import { couvertureUrl } from "@/lib/imageUrl";
import { useLivres } from "@/hooks/useLivres";

type Tab = "carte" | "historique" | "amendes" | "stats" | "wishlist" | "alertes" | "listes";

export default function EspaceMembrePage() {
  const t = useT();
  const utilisateur = useAuthStore((s) => s.utilisateur);
  const uid = utilisateur?.id;
  const isEnseignant = utilisateur?.role === "ENSEIGNANT";
  const [tab, setTab] = useState<Tab>("carte");
  const [histPage, setHistPage] = useState(0);

  const { data: carte,      isLoading: loadingCarte }    = useCarteMembre(uid);
  const { data: historique, isLoading: loadingHist }     = useHistoriqueEmprunts(uid, histPage);
  const { data: amendes,    isLoading: loadingAmendes }  = useAmendesUtilisateur(uid);
  const { data: stats,      isLoading: loadingStats }    = useStatistiquesPersonnelles(uid);
  const { data: wishlist,   isLoading: loadingWishlist } = useWishlist(uid);
  const { data: alertes,    isLoading: loadingAlertes }  = useAlertes(uid);
  const { data: mesListes,  isLoading: loadingListes }   = useMesListes(isEnseignant ? uid : undefined);

  const toggleWishlist = useToggleWishlist();
  const supprimerAlerte = useSupprimerAlerte();
  const creerAlerte = useCreerAlerte();
  const creerListe = useCreerListe();
  const supprimerListe = useSupprimerListe();
  const ajouterLivre = useAjouterLivreListe();
  const retirerLivre = useRetirerLivreListe();

  // Alerte form
  const [alerteType, setAlerteType] = useState<"CATEGORIE" | "AUTEUR">("CATEGORIE");
  const [alerteValeur, setAlerteValeur] = useState("");

  // Liste form
  const [showListeForm, setShowListeForm] = useState(false);
  const [listeTitre, setListeTitre] = useState("");
  const [listeCours, setListeCours] = useState("");
  const [listePublique, setListePublique] = useState(false);
  // Ajout livre dans liste
  const [searchListeId, setSearchListeId] = useState<number | null>(null);
  const [searchLivre, setSearchLivre] = useState("");

  const em = (t as any).espaceMembre ?? {};

  // Recherche livres pour ajout dans liste
  const { data: livresSearch } = useLivres({
    q: searchLivre || undefined,
    page: 0,
    size: 6,
    enabled: searchLivre.length > 1,
  } as any);

  const tabs: { key: Tab; label: string; icon: any; enseignantOnly?: boolean }[] = [
    { key: "carte",      label: em.carteMembre    ?? "Carte membre",       icon: faIdCard },
    { key: "historique", label: em.historique     ?? "Historique",         icon: faClockRotateLeft },
    { key: "amendes",    label: em.amendes        ?? "Amendes",            icon: faTriangleExclamation },
    { key: "stats",      label: em.statistiques   ?? "Statistiques",       icon: faChartPie },
    { key: "wishlist",   label: em.wishlist       ?? "Liste de souhaits",  icon: faHeart },
    { key: "alertes",    label: em.alertes        ?? "Alertes",            icon: faBell },
    { key: "listes",     label: em.listesLecture  ?? "Listes de lecture",  icon: faBookmark, enseignantOnly: true },
  ];

  const visibleTabs = tabs.filter((tb) => !tb.enseignantOnly || isEnseignant);

  const statutColor: Record<string, string> = {
    EN_COURS: "text-blue-600 bg-blue-50",
    RETOURNE: "text-green-600 bg-green-50",
    EN_RETARD: "text-red-600 bg-red-50",
  };

  const loadingMap: Record<Tab, boolean> = {
    carte: loadingCarte,
    historique: loadingHist,
    amendes: loadingAmendes,
    stats: loadingStats,
    wishlist: loadingWishlist,
    alertes: loadingAlertes,
    listes: loadingListes,
  };

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{em.titre ?? "Mon espace membre"}</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {visibleTabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              tab === tb.key
                ? "bg-white shadow text-primary"
                : "text-text-2 hover:text-text-1"
            }`}
          >
            <FontAwesomeIcon icon={tb.icon} style={{ fontSize: 13 }} />
            {tb.label}
          </button>
        ))}
      </div>

      {/* Spinner global par onglet */}
      {loadingMap[tab] && (
        <div className="flex items-center justify-center py-16">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-primary text-3xl" />
        </div>
      )}

      {/* ── Carte membre ── */}
      {tab === "carte" && !loadingCarte && carte && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-6 shadow-soft space-y-3">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {carte.utilisateur.prenom[0]}{carte.utilisateur.nom[0]}
              </div>
              <div>
                <p className="font-heading text-xl font-bold">{carte.utilisateur.prenom} {carte.utilisateur.nom}</p>
                <p className="text-sm text-text-2">@{carte.utilisateur.identifiant}</p>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {carte.utilisateur.role}
                </span>
              </div>
            </div>
            <div className="border-t border-border pt-3 text-sm text-text-2 space-y-1">
              <p>{em.email ?? "Email"} : <span className="text-text-1">{carte.utilisateur.email}</span></p>
              <p>{em.membreDepuis ?? "Membre depuis"} : <span className="text-text-1">{new Date(carte.utilisateur.dateInscription).toLocaleDateString()}</span></p>
              <p className="flex items-center gap-1">
                {carte.utilisateur.actif
                  ? <><FontAwesomeIcon icon={faCheckCircle} className="text-green-500" /> <span className="text-green-600">{em.actif ?? "Actif"}</span></>
                  : <><FontAwesomeIcon icon={faExclamationCircle} className="text-red-500" /> <span className="text-red-600">{em.inactif ?? "Inactif"}</span></>
                }
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: em.empruntsEnCours ?? "Emprunts en cours", value: carte.stats.empruntsEnCours, color: "text-blue-600" },
              { label: em.empruntsEnRetard ?? "En retard",        value: carte.stats.empruntsEnRetard, color: "text-red-600" },
              { label: em.totalEmprunts ?? "Total emprunts",      value: carte.stats.totalEmprunts,    color: "text-text-1" },
              { label: em.amendesDues ?? "Amendes dues (FCFA)",   value: carte.stats.amendesDues,      color: "text-orange-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-white p-4 shadow-soft text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-xs text-text-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Historique ── */}
      {tab === "historique" && !loadingHist && (
        <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-2">
              <tr>
                {[em.titre2 ?? "Titre", em.dateEmprunt ?? "Emprunt", em.dateRetour ?? "Retour prévu", em.statut ?? "Statut", em.amende ?? "Amende"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(historique?.content ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-medium">{e.titre}</td>
                  <td className="px-4 py-3 text-text-2">{new Date(e.dateEmprunt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-text-2">{new Date(e.dateRetourPrevue).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statutColor[e.statut] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.amende > 0 ? <span className="text-red-600 font-semibold">{e.amende} FCFA</span> : "—"}</td>
                </tr>
              ))}
              {!historique?.content?.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-2">{em.aucunHistorique ?? "Aucun historique"}</td></tr>
              )}
            </tbody>
          </table>
          {(historique?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <button disabled={histPage === 0} onClick={() => setHistPage((p) => p - 1)} className="disabled:opacity-40 hover:text-primary">← {em.precedent ?? "Précédent"}</button>
              <span className="text-text-2">{histPage + 1} / {historique?.totalPages}</span>
              <button disabled={histPage + 1 >= (historique?.totalPages ?? 1)} onClick={() => setHistPage((p) => p + 1)} className="disabled:opacity-40 hover:text-primary">{em.suivant ?? "Suivant"} →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Amendes ── */}
      {tab === "amendes" && !loadingAmendes && (
        <div className="space-y-4">
          {amendes && amendes.totalDu > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500 text-xl" />
              <div>
                <p className="font-semibold text-red-700">{em.totalDu ?? "Total dû"} : {amendes.totalDu} FCFA</p>
                <p className="text-sm text-red-600">{em.contactBibliotheque ?? "Contactez la bibliothèque pour régulariser."}</p>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-2">
                <tr>
                  {[em.titre2 ?? "Titre", em.retourPrevu ?? "Retour prévu", em.joursRetard ?? "Jours retard", em.montant ?? "Montant"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(amendes?.amendesEnCours ?? []).map((a) => (
                  <tr key={a.empruntId} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-medium">{a.titre}</td>
                    <td className="px-4 py-3 text-text-2">{new Date(a.dateRetourPrevue).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-red-600 font-semibold">{a.joursRetard}j</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{a.montant} FCFA</td>
                  </tr>
                ))}
                {!amendes?.amendesEnCours?.length && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-text-2">{em.aucuneAmende ?? "Aucune amende en cours"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Statistiques ── */}
      {tab === "stats" && !loadingStats && stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft space-y-3">
            <h3 className="font-semibold">{em.resumeActivite ?? "Résumé d'activité"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: em.totalEmprunts ?? "Total emprunts",       value: stats.totalEmprunts },
                { label: em.anneeEnCours ?? "Cette année",           value: stats.empruntsAnneeEnCours },
                { label: em.nombreRetards ?? "Retards",              value: stats.nombreRetards },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-surface-2 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-text-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft space-y-3">
            <h3 className="font-semibold">{em.topCategories ?? "Top catégories"}</h3>
            <div className="space-y-2">
              {Object.entries(stats.topCategories ?? {}).slice(0, 5).map(([cat, nb]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">{cat}</span>
                  <div className="h-2 w-24 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (nb as number) * 10)}%` }} />
                  </div>
                  <span className="text-xs text-text-2 w-4 text-right">{nb as number}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft space-y-3 md:col-span-2">
            <h3 className="font-semibold">{em.topAuteurs ?? "Top auteurs"}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.topAuteurs ?? {}).slice(0, 8).map(([auteur, nb]) => (
                <span key={auteur} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {auteur} ({nb as number})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Wishlist ── */}
      {tab === "wishlist" && !loadingWishlist && (
        <div>
          {!(wishlist ?? []).length ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center text-text-2 shadow-soft">
              <FontAwesomeIcon icon={faHeart} className="mb-3 text-4xl text-text-3" />
              <p>{em.wishlistVide ?? "Votre liste de souhaits est vide."}</p>
              <Link to="/livres" className="mt-3 inline-block text-sm text-primary hover:underline">{em.parcourirCatalogue ?? "Parcourir le catalogue"}</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(wishlist ?? []).map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-white p-4 shadow-soft flex gap-3">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {item.livre.couverture
                      ? <img src={couvertureUrl(item.livre.couverture) ?? ""} alt={item.livre.titre} className="h-full w-full object-cover" />
                      : <div className="grid h-full place-items-center text-text-3"><FontAwesomeIcon icon={faBookmark} /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/livres/${item.livre.id}`} className="line-clamp-2 font-medium hover:text-primary text-sm">{item.livre.titre}</Link>
                    <p className="text-xs text-text-2 mt-0.5">{item.livre.auteur}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-semibold ${item.livre.nombreDisponibles > 0 ? "text-green-600" : "text-red-500"}`}>
                        {item.livre.nombreDisponibles > 0 ? (em.disponible ?? "Disponible") : (em.indisponible ?? "Indisponible")}
                      </span>
                      <button
                        onClick={() => toggleWishlist.mutate({ livreId: item.livre.id, utilisateurId: uid!, inWishlist: true })}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title={em.retirerWishlist ?? "Retirer"}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Alertes thématiques ── */}
      {tab === "alertes" && !loadingAlertes && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft space-y-3">
            <h3 className="font-semibold">{em.nouvelleAlerte ?? "Nouvelle alerte"}</h3>
            <div className="flex flex-wrap gap-2">
              <select
                value={alerteType}
                onChange={(e) => setAlerteType(e.target.value as any)}
                className="h-9 rounded-md border border-border px-2 text-sm"
              >
                <option value="CATEGORIE">{em.categorie ?? "Catégorie"}</option>
                <option value="AUTEUR">{em.auteur ?? "Auteur"}</option>
              </select>
              <input
                value={alerteValeur}
                onChange={(e) => setAlerteValeur(e.target.value)}
                placeholder={alerteType === "CATEGORIE" ? (em.nomCategorie ?? "Nom de la catégorie") : (em.nomAuteur ?? "Nom de l'auteur")}
                className="h-9 flex-1 min-w-[180px] rounded-md border border-border px-3 text-sm"
              />
              <button
                disabled={!alerteValeur.trim() || creerAlerte.isPending}
                onClick={() => {
                  creerAlerte.mutate({ utilisateurId: uid!, typeAlerte: alerteType, valeur: alerteValeur.trim() });
                  setAlerteValeur("");
                }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 12 }} />
                {em.ajouter ?? "Ajouter"}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {(alertes ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{a.typeAlerte}</span>
                  <span className="text-sm font-medium">{a.valeur}</span>
                </div>
                <button
                  onClick={() => supprimerAlerte.mutate({ id: a.id, utilisateurId: uid! })}
                  className="text-text-3 hover:text-danger transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: 13 }} />
                </button>
              </div>
            ))}
            {!(alertes ?? []).length && (
              <p className="rounded-xl border border-border bg-white px-4 py-8 text-center text-text-2 shadow-soft">
                {em.aucuneAlerte ?? "Aucune alerte configurée."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Listes de lecture (ENSEIGNANT) ── */}
      {tab === "listes" && isEnseignant && !loadingListes && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowListeForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white"
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: 12 }} />
              {em.nouvelleListe ?? "Nouvelle liste"}
            </button>
          </div>

          {showListeForm && (
            <div className="rounded-xl border border-border bg-white p-5 shadow-soft space-y-3">
              <h3 className="font-semibold">{em.creerListe ?? "Créer une liste de lecture"}</h3>
              <input
                value={listeTitre}
                onChange={(e) => setListeTitre(e.target.value)}
                placeholder={em.titreListe ?? "Titre de la liste *"}
                className="h-9 w-full rounded-md border border-border px-3 text-sm"
              />
              <input
                value={listeCours}
                onChange={(e) => setListeCours(e.target.value)}
                placeholder={em.cours ?? "Cours associé (optionnel)"}
                className="h-9 w-full rounded-md border border-border px-3 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={listePublique} onChange={(e) => setListePublique(e.target.checked)} />
                {em.rendrePublique ?? "Rendre publique"}
              </label>
              <div className="flex gap-2">
                <button
                  disabled={!listeTitre.trim() || creerListe.isPending}
                  onClick={() => {
                    creerListe.mutate({
                      enseignantId: uid!,
                      payload: { titre: listeTitre.trim(), cours: listeCours || undefined, publique: listePublique },
                    });
                    setListeTitre(""); setListeCours(""); setListePublique(false); setShowListeForm(false);
                  }}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {creerListe.isPending ? (em.creation ?? "Création...") : (em.creer ?? "Créer")}
                </button>
                <button onClick={() => setShowListeForm(false)} className="rounded-md border border-border px-4 py-2 text-sm">
                  {em.annuler ?? "Annuler"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {(mesListes ?? []).map((liste) => (
              <div key={liste.id} className="rounded-xl border border-border bg-white p-5 shadow-soft space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold">{liste.titre}</h4>
                    {liste.cours && <p className="text-xs text-text-2">{liste.cours}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${liste.publique ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      <FontAwesomeIcon icon={liste.publique ? faGlobe : faLock} style={{ fontSize: 10 }} className="mr-1" />
                      {liste.publique ? (em.publique ?? "Publique") : (em.privee ?? "Privée")}
                    </span>
                    <button
                      onClick={() => supprimerListe.mutate(liste.id)}
                      className="text-text-3 hover:text-danger transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: 13 }} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-2">{liste.livres.length} {em.livres ?? "livre(s)"}</p>
                <div className="flex flex-wrap gap-1">
                  {liste.livres.slice(0, 4).map((l) => (
                    <Link key={l.id} to={`/livres/${l.id}`} className="rounded bg-surface-2 px-2 py-0.5 text-xs hover:text-primary truncate max-w-[120px]">
                      {l.titre}
                    </Link>
                  ))}
                  {liste.livres.length > 4 && (
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-2">+{liste.livres.length - 4}</span>
                  )}
                </div>

                {/* Livres de la liste avec suppression */}
                {liste.livres.length > 0 && (
                  <div className="space-y-1 border-t border-border pt-2">
                    {liste.livres.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-2">
                        <Link to={`/livres/${l.id}`} className="text-xs hover:text-primary truncate flex-1">{l.titre}</Link>
                        <button
                          onClick={() => retirerLivre.mutate({ id: liste.id, livreId: l.id })}
                          className="shrink-0 text-text-3 hover:text-danger transition-colors"
                        >
                          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajout livre */}
                {searchListeId === liste.id ? (
                  <div className="border-t border-border pt-2 space-y-2">
                    <div className="relative">
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-3" style={{ fontSize: 11 }} />
                      <input
                        autoFocus
                        value={searchLivre}
                        onChange={(e) => setSearchLivre(e.target.value)}
                        placeholder={em.rechercherLivre ?? "Rechercher un livre..."}
                        className="h-8 w-full rounded-md border border-border pl-7 pr-3 text-xs"
                      />
                    </div>
                    {searchLivre.length > 1 && (livresSearch?.content ?? []).length > 0 && (
                      <div className="rounded-md border border-border bg-white shadow-sm divide-y divide-border max-h-40 overflow-y-auto">
                        {(livresSearch?.content ?? []).map((livre) => {
                          const dejaDans = liste.livres.some((l) => l.id === livre.id);
                          return (
                            <button
                              key={livre.id}
                              disabled={dejaDans || ajouterLivre.isPending}
                              onClick={() => {
                                ajouterLivre.mutate({ id: liste.id, livreId: livre.id });
                                setSearchLivre("");
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-2 disabled:opacity-50"
                            >
                              <span className="truncate">{livre.titre}</span>
                              {dejaDans
                                ? <span className="text-text-3 shrink-0 ml-2">{em.dejaDans ?? "Déjà ajouté"}</span>
                                : <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10 }} className="text-primary shrink-0 ml-2" />
                              }
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => { setSearchListeId(null); setSearchLivre(""); }}
                      className="text-xs text-text-3 hover:text-text-1"
                    >
                      {em.annuler ?? "Annuler"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSearchListeId(liste.id); setSearchLivre(""); }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10 }} />
                    {em.ajouterLivre ?? "Ajouter un livre"}
                  </button>
                )}
              </div>
            ))}
            {!(mesListes ?? []).length && !showListeForm && (
              <p className="col-span-2 rounded-xl border border-border bg-white px-4 py-8 text-center text-text-2 shadow-soft">
                {em.aucuneListe ?? "Aucune liste de lecture."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Note étoiles déco */}
      <div className="flex justify-center gap-1 pt-2 opacity-20">
        {[1,2,3,4,5].map((i) => <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400" style={{ fontSize: 10 }} />)}
      </div>
    </section>
  );
}
