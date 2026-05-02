import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faBookOpen, faUser, faClipboardList, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { livresApi } from "@/api/livres.api";
import { utilisateursApi } from "@/api/utilisateurs.api";
import { useAuthStore } from "@/stores/auth.store";

interface Result {
  id: number;
  label: string;
  sub: string;
  type: "livre" | "utilisateur";
  path: string;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isStaff = useAuthStore((s) => s.hasRole(["ADMIN", "BIBLIOTHECAIRE"]));
  const debounced = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const promises: Promise<Result[]>[] = [
        livresApi.getAll({ q, size: 4 }).then((r) =>
          (r.data.content ?? []).map((l: any) => ({
            id: l.id, label: l.titre, sub: l.auteur ?? "",
            type: "livre" as const, path: `/livres/${l.id}`,
          }))
        ),
      ];
      if (isStaff) {
        promises.push(
          utilisateursApi.getAll({ search: q, size: 3 }).then((r) =>
            (r.data.content ?? []).map((u: any) => ({
              id: u.id, label: `${u.prenom} ${u.nom}`, sub: u.email ?? "",
              type: "utilisateur" as const, path: `/utilisateurs/${u.id}`,
            }))
          )
        );
      }
      const all = (await Promise.all(promises)).flat();
      setResults(all);
      setOpen(all.length > 0);
      setSelected(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => { search(debounced); }, [debounced, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, -1)); }
    if (e.key === "Enter" && selected >= 0) { navigate(results[selected].path); setOpen(false); setQuery(""); }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    if (e.key === "Enter" && selected < 0 && query.trim()) {
      navigate(`/livres?search=${encodeURIComponent(query.trim())}`);
      setOpen(false); setQuery("");
    }
  };

  const go = (path: string) => { navigate(path); setOpen(false); setQuery(""); };

  const icon = (type: Result["type"]) =>
    type === "livre" ? faBookOpen : type === "utilisateur" ? faUser : faClipboardList;

  return (
    <div ref={containerRef} className="relative w-64 xl:w-80">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${open || query ? "border-primary bg-white shadow-md" : "border-border bg-surface-2"}`}>
        {loading
          ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-text-3" style={{ fontSize: 14 }} />
          : <FontAwesomeIcon icon={faMagnifyingGlass} className="text-text-3" style={{ fontSize: 14 }} />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher..."
          className="flex-1 bg-transparent text-sm text-text-1 outline-none placeholder:text-text-3"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="text-text-3 hover:text-text-1 text-xs">✕</button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-white shadow-xl"
          >
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r.path)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface ${selected === i ? "bg-surface" : ""}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.type === "livre" ? "bg-primary/10 text-primary" : "bg-purple-100 text-purple-600"}`}>
                  <FontAwesomeIcon icon={icon(r.type)} style={{ fontSize: 13 }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-1">{r.label}</p>
                  <p className="truncate text-xs text-text-3">{r.sub}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.type === "livre" ? "bg-primary/10 text-primary" : "bg-purple-100 text-purple-600"}`}>
                  {r.type === "livre" ? "Livre" : "Utilisateur"}
                </span>
              </button>
            ))}
            <button
              onClick={() => { navigate(`/livres?q=${encodeURIComponent(query)}`); setOpen(false); setQuery(""); }}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-text-3 hover:bg-surface transition-colors"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 11 }} />
              Voir tous les résultats pour « {query} »
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
