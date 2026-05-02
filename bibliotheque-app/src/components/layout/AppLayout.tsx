import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore, resolveTemplate } from "@/stores/ui.store";
import Sidebar from "./Sidebar";
import Header from "./Header";
import TemplatePanel from "@/components/shared/TemplatePanel";

function applyTokens(tokens: ReturnType<typeof resolveTemplate>["tokens"], isDark: boolean) {
  const root = document.documentElement;

  root.style.setProperty("--color-primary",       tokens.primary);
  root.style.setProperty("--color-primary-light",  tokens.primaryLight);
  root.style.setProperty("--color-primary-pale",   tokens.primaryPale);
  root.style.setProperty("--color-accent",         tokens.accent);
  root.style.setProperty("--color-accent-dark",    tokens.accentDark);
  root.style.setProperty("--color-danger",         tokens.danger);
  root.style.setProperty("--color-success",        tokens.success);
  root.style.setProperty("--color-warning",        tokens.warning);
  root.style.setProperty("--color-info",           tokens.info);
  root.style.setProperty("--radius",               tokens.radius);
  root.style.setProperty("--sidebar-from",         tokens.sidebarFrom);
  root.style.setProperty("--sidebar-mid",          tokens.sidebarMid);
  root.style.setProperty("--sidebar-to",           tokens.sidebarTo);

  // Surfaces & textes selon le mode
  if (isDark) {
    root.style.setProperty("--color-surface",   "#171714");
    root.style.setProperty("--color-surface-2", "#1f1f1b");
    root.style.setProperty("--color-surface-3", "#2b2b25");
    root.style.setProperty("--color-border",    "#3d3d36");
    root.style.setProperty("--color-text-1",    "#f4f4ef");
    root.style.setProperty("--color-text-2",    "#d4d4cc");
    root.style.setProperty("--color-text-3",    "#9e9e95");
  } else {
    root.style.setProperty("--color-surface",   "#fafaf8");
    root.style.setProperty("--color-surface-2", "#f2f0eb");
    root.style.setProperty("--color-surface-3", "#e8e5de");
    root.style.setProperty("--color-border",    "#d4cfc6");
    root.style.setProperty("--color-text-1",    "#1a1a18");
    root.style.setProperty("--color-text-2",    "#4a4a45");
    root.style.setProperty("--color-text-3",    "#8a8a82");
  }

  root.classList.toggle("dark", isDark);
}

export default function AppLayout() {
  const { themeMode, templateId, customTemplates, sidebarCollapsed, toggleSidebar } = useUiStore();
  const location = useLocation();

  useEffect(() => {
    const tpl = resolveTemplate({ templateId, customTemplates });
    applyTokens(tpl.tokens, themeMode === "dark");
  }, [themeMode, templateId, customTemplates]);

  return (
    <div className="flex min-h-screen bg-surface transition-colors duration-300">
      {/* Overlay mobile */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="relative z-40 md:z-auto">
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 p-6"
        >
          <Outlet />
        </motion.main>
      </div>

      {/* Panneau de templates (slide depuis la droite) */}
      <TemplatePanel />
    </div>
  );
}
