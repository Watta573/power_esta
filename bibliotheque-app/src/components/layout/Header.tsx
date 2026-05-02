import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faMoon, faSun, faChevronRight, faHouse, faPalette, faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import GlobalSearch from "@/components/shared/GlobalSearch";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { useNotificationsCount } from "@/hooks/useNotifications";
import { useI18nStore, useT, type Locale } from "@/stores/i18n.store";

const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: "fr", flag: "🇫🇷", label: "Français" },
  { value: "en", flag: "🇬🇧", label: "English" },
];

function LanguagePicker() {
  const { locale, setLocale } = useI18nStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.value === locale)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-sm transition-colors ${
          open
            ? "border-primary bg-primary text-white"
            : "border-border bg-white text-text-2 hover:bg-surface-2 hover:text-text-1"
        }`}
        title={t.header.langue}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase">{current.value}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          style={{ fontSize: 10 }}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-white shadow-xl"
          >
            {LOCALES.map((loc) => (
              <button
                key={loc.value}
                onClick={() => { setLocale(loc.value); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-surface ${
                  locale === loc.value ? "font-semibold text-primary" : "text-text-1"
                }`}
              >
                <span className="text-base">{loc.flag}</span>
                <span className="flex-1 text-left">{loc.label}</span>
                {locale === loc.value && (
                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: 11 }} className="text-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { utilisateur } = useAuthStore();
  const { themeMode, toggleThemeMode, setTemplatePanelOpen, templatePanelOpen } = useUiStore();
  const notifCount = useNotificationsCount(utilisateur?.id).data ?? 0;
  const t = useT();

  const segments = location.pathname.split("/").filter(Boolean);
  const isDark = themeMode === "dark";

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-md transition-colors duration-300"
      style={{ height: "var(--header-height)" }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <Link to="/dashboard" className="text-text-3 transition-colors hover:text-primary">
          <FontAwesomeIcon icon={faHouse} style={{ fontSize: 14 }} />
        </Link>
        <AnimatePresence mode="wait">
          {segments.map((seg, i) => {
            const path = "/" + segments.slice(0, i + 1).join("/");
            const label = (t.routes as Record<string, string>)[seg] ?? seg.replace(/-/g, " ");
            const isLast = i === segments.length - 1;
            return (
              <motion.span
                key={path}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 12 }} className="text-text-3" />
                {isLast ? (
                  <span className="font-semibold text-text-1">{label}</span>
                ) : (
                  <Link to={path} className="text-text-3 transition-colors hover:text-primary">
                    {label}
                  </Link>
                )}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <GlobalSearch />

        {/* Toggle Dark / Light */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleThemeMode}
          className="relative flex h-9 w-16 items-center rounded-full border border-border bg-surface-2 p-1 shadow-inner transition-colors"
          title={isDark ? t.header.modeClair : t.header.modeSombre}
        >
          <FontAwesomeIcon icon={faSun} style={{ fontSize: 11 }} className="absolute left-2 text-amber-400" />
          <FontAwesomeIcon icon={faMoon} style={{ fontSize: 11 }} className="absolute right-2 text-slate-400" />
          <motion.div
            animate={{ x: isDark ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md"
            style={{ background: isDark ? "#1e293b" : "#fff" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={themeMode}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {isDark
                  ? <FontAwesomeIcon icon={faMoon} style={{ fontSize: 13 }} className="text-blue-300" />
                  : <FontAwesomeIcon icon={faSun} style={{ fontSize: 13 }} className="text-amber-500" />
                }
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.button>

        {/* Apparence / Templates */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTemplatePanelOpen(!templatePanelOpen)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors ${
            templatePanelOpen
              ? "border-primary bg-primary text-white"
              : "border-border bg-white text-text-2 hover:bg-surface-2 hover:text-text-1"
          }`}
          title={t.header.apparence}
        >
          <FontAwesomeIcon icon={faPalette} style={{ fontSize: 16 }} />
        </motion.button>

        {/* Language picker */}
        <LanguagePicker />

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/communication")}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-2 shadow-sm transition-colors hover:bg-surface-2 hover:text-text-1"
        >
          <FontAwesomeIcon icon={faBell} style={{ fontSize: 16 }} />
          {notifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow"
            >
              {notifCount > 99 ? "99+" : notifCount}
            </motion.span>
          )}
        </motion.button>

        {/* Profil */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/profil")}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-1.5 shadow-sm transition-colors hover:bg-surface-2"
        >
          <div className="relative h-7 w-7 overflow-hidden rounded-lg">
            {utilisateur?.photo ? (
              <img src={utilisateur.photo} alt="profil" className="h-full w-full object-cover" />
            ) : (
              <div
                className="grid h-full w-full place-items-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
              >
                {utilisateur?.prenom?.[0]?.toUpperCase()}{utilisateur?.nom?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-text-1 leading-tight">
              {utilisateur?.prenom} {utilisateur?.nom}
            </div>
            <div className="text-[10px] text-text-3 leading-tight">{utilisateur?.role}</div>
          </div>
        </motion.button>
      </div>
    </header>
  );
}
