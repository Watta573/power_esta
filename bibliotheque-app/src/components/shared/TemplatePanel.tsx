import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Upload, Trash2, Check, Download, AlertCircle } from "lucide-react";
import { useUiStore, BUILT_IN_TEMPLATES, resolveTemplate, type AppTemplate } from "@/stores/ui.store";
import { toast } from "sonner";

// ── Preview miniature d'un template ──────────────────────────────────────────
function TemplatePreview({ tpl, active, onClick }: { tpl: AppTemplate; active: boolean; onClick: () => void }) {
  const { themeMode } = useUiStore();
  const isDarkMode = themeMode === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-xl border-2 text-left transition-all ${
        active ? "border-[var(--color-primary)] shadow-lg" : "border-border hover:border-[var(--color-primary)]/40"
      }`}
    >
      {/* Mini sidebar preview */}
      <div className="flex h-20 overflow-hidden rounded-t-[10px]">
        <div
          className="flex w-10 flex-col gap-1 p-1.5"
          style={{ background: `linear-gradient(160deg, ${tpl.tokens.sidebarFrom}, ${tpl.tokens.sidebarTo})` }}
        >
          <div className="h-2 w-2 rounded-sm" style={{ background: tpl.tokens.accent }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 rounded-sm bg-white/20" style={{ width: `${60 + i * 10}%` }} />
          ))}
        </div>
        <div
          className="flex-1 p-2 space-y-1.5"
          style={{ background: isDarkMode ? "#1a1a18" : "#fafaf8" }}
        >
          <div className="flex gap-1">
            {[tpl.tokens.primary, tpl.tokens.accent, tpl.tokens.danger].map((c) => (
              <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-gray-200/60" style={{ width: "80%" }} />
          <div className="h-1.5 rounded-full bg-gray-200/60" style={{ width: "60%" }} />
          <div
            className="h-3 w-12 rounded"
            style={{ background: tpl.tokens.primary, opacity: 0.8 }}
          />
        </div>
      </div>

      {/* Infos */}
      <div className="flex items-center justify-between bg-surface p-2.5">
        <div>
          <p className="text-xs font-semibold text-text-1">{tpl.emoji} {tpl.name}</p>
          <p className="text-[10px] text-text-3 leading-tight">{tpl.description}</p>
        </div>
        {active && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: tpl.tokens.primary }}
          >
            <Check size={11} className="text-white" />
          </motion.div>
        )}
        {!tpl.builtIn && (
          <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
            CUSTOM
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ── Panneau principal ─────────────────────────────────────────────────────────
export default function TemplatePanel() {
  const {
    templatePanelOpen, setTemplatePanelOpen,
    templateId, setTemplate,
    themeMode, toggleThemeMode,
    customTemplates, addCustomTemplate, removeCustomTemplate,
  } = useUiStore();

  const [importError, setImportError] = useState("");
  const [importJson, setImportJson] = useState("");
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];

  // ── Import depuis fichier JSON ──
  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportJson(ev.target?.result as string);
      setShowImport(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Valider et appliquer le JSON importé ──
  function applyImport() {
    setImportError("");
    try {
      const parsed = JSON.parse(importJson) as Partial<AppTemplate>;
      if (!parsed.name || !parsed.tokens) throw new Error("Champs 'name' et 'tokens' requis.");
      const required: Array<keyof AppTemplate["tokens"]> = [
        "primary", "primaryLight", "primaryPale", "accent", "accentDark",
        "sidebarFrom", "sidebarMid", "sidebarTo", "danger", "success", "warning", "info", "radius",
      ];
      const missing = required.filter((k) => !parsed.tokens![k]);
      if (missing.length) throw new Error(`Tokens manquants : ${missing.join(", ")}`);

      const tpl: AppTemplate = {
        id: `custom-${Date.now()}`,
        name: parsed.name,
        description: parsed.description ?? "Template personnalisé",
        emoji: parsed.emoji ?? "🎨",
        tokens: parsed.tokens as AppTemplate["tokens"],
        builtIn: false,
      };
      addCustomTemplate(tpl);
      setTemplate(tpl.id);
      setShowImport(false);
      setImportJson("");
      toast.success(`Template "${tpl.name}" importé avec succès`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "JSON invalide");
    }
  }

  // ── Export du template actif ──
  function exportCurrentTemplate() {
    const tpl = resolveTemplate({ templateId, customTemplates });
    const blob = new Blob([JSON.stringify({ ...tpl, id: undefined, builtIn: undefined }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template-${tpl.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template exporté");
  }

  return (
    <AnimatePresence>
      {templatePanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setTemplatePanelOpen(false)}
          />

          {/* Panneau */}
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-surface shadow-2xl"
          >
            {/* Header panneau */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-semibold text-text-1">Apparence</h2>
                <p className="text-xs text-text-3">Thème & templates</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTemplatePanelOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-3 hover:bg-surface-2 hover:text-text-1"
              >
                <X size={15} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 p-5">

              {/* ── Toggle Dark / Light ── */}
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-text-3">Mode d'affichage</p>
                <div className="flex rounded-xl border border-border bg-surface-2 p-1">
                  {(["light", "dark"] as const).map((mode) => (
                    <motion.button
                      key={mode}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { if (themeMode !== mode) toggleThemeMode(); }}
                      className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                        themeMode === mode ? "text-text-1" : "text-text-3 hover:text-text-2"
                      }`}
                    >
                      {themeMode === mode && (
                        <motion.div
                          layoutId="mode-pill"
                          className="absolute inset-0 rounded-lg bg-white shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {mode === "light" ? <Sun size={14} /> : <Moon size={14} />}
                        {mode === "light" ? "Clair" : "Sombre"}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

      {/* ── Templates ── */}
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-text-3">Templates</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {allTemplates.map((tpl) => (
                    <div key={tpl.id} className="group relative">
                      <TemplatePreview
                        tpl={tpl}
                        active={templateId === tpl.id}
                        onClick={() => setTemplate(tpl.id)}
                      />
                      {!tpl.builtIn && (
                        <button
                          onClick={() => {
                            removeCustomTemplate(tpl.id);
                            if (templateId === tpl.id) setTemplate("foret");
                          }}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 size={9} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Import / Export ── */}
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-text-3">Import / Export</p>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border bg-surface-2 px-4 py-3 text-sm text-text-2 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    <Upload size={15} />
                    Importer un template (.json)
                  </motion.button>
                  <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={exportCurrentTemplate}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text-2 transition-colors hover:bg-surface-3"
                  >
                    <Download size={15} />
                    Exporter le template actif
                  </motion.button>
                </div>
              </div>

              {/* ── Zone de collage JSON ── */}
              <AnimatePresence>
                {showImport && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <p className="text-xs font-medium text-text-2">Ou coller le JSON :</p>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      rows={6}
                      placeholder='{ "name": "Mon thème", "tokens": { ... } }'
                      className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {importError && (
                      <p className="flex items-center gap-1.5 text-xs text-danger">
                        <AlertCircle size={12} /> {importError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={applyImport}
                        className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-light"
                      >
                        Appliquer
                      </button>
                      <button
                        onClick={() => { setShowImport(false); setImportJson(""); setImportError(""); }}
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-text-2 hover:bg-surface-2"
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Coller JSON manuellement ── */}
              {!showImport && (
                <button
                  onClick={() => setShowImport(true)}
                  className="w-full text-center text-xs text-text-3 underline-offset-2 hover:text-text-2 hover:underline"
                >
                  Coller un JSON manuellement
                </button>
              )}

              {/* ── Format attendu ── */}
              <details className="rounded-xl border border-border bg-surface-2 p-3">
                <summary className="cursor-pointer text-xs font-medium text-text-2">
                  Format JSON attendu
                </summary>
                <pre className="mt-2 overflow-x-auto text-[10px] text-text-3 leading-relaxed">{`{
  "name": "Mon thème",
  "description": "Description",
  "emoji": "🎨",
  "tokens": {
    "primary": "#1b4332",
    "primaryLight": "#2d6a4f",
    "primaryPale": "#d8f3dc",
    "accent": "#e9c46a",
    "accentDark": "#c9a227",
    "sidebarFrom": "#1b4332",
    "sidebarMid": "#0d2b1f",
    "sidebarTo": "#081a13",
    "danger": "#e63946",
    "success": "#2d6a4f",
    "warning": "#e9c46a",
    "info": "#457b9d",
    "radius": "10px"
  }
}`}</pre>
              </details>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
