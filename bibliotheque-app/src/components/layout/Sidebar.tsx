import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen, faGaugeHigh, faRightFromBracket, faUser, faUsers,
  faCalendarCheck, faClipboardList, faChartBar, faBell, faShield,
  faCartShopping, faDollarSign, faNewspaper, faMagnifyingGlass,
  faClockRotateLeft, faBookmark, faHouse, faChevronDown, faChartLine,
  faChevronLeft, faTriangleExclamation, faGear, faIdCard, faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { useT } from "@/stores/i18n.store";
import type { Role } from "@/types";

interface NavItem { to: string; labelKey: string; icon: any; badge?: string }
interface NavSection { sectionKey: string; items: NavItem[] }
type NavConfig = Record<Role, NavSection[]>

const NAV: NavConfig = {
  ADMIN: [
    {
      sectionKey: "principale",
      items: [
        { to: "/dashboard",                     labelKey: "tableauDeBord",    icon: faGaugeHigh },
        { to: "/administration?tab=audit",      labelKey: "journalActivite", icon: faChartLine },
      ],
    },
    {
      sectionKey: "systeme",
      items: [
        { to: "/administration",                labelKey: "utilisateurs",        icon: faUsers },
        { to: "/administration?tab=parametres", labelKey: "rolesPermissions", icon: faShield },
        { to: "/administration?tab=parametres", labelKey: "parametres",          icon: faGear },
      ],
    },
    {
      sectionKey: "bibliotheque",
      items: [
        { to: "/livres",        labelKey: "catalogueLivres",  icon: faBookOpen },
        { to: "/utilisateurs",  labelKey: "lecteurs",         icon: faUsers },
        { to: "/emprunts",      labelKey: "empruntsRetours",  icon: faClipboardList },
        { to: "/reservations",  labelKey: "reservations",     icon: faCalendarCheck },
        { to: "/periodiques",   labelKey: "periodiques",      icon: faNewspaper },
        { to: "/acquisitions",  labelKey: "acquisitions",     icon: faCartShopping },
        { to: "/abonnement",    labelKey: "abonnements",    icon: faDollarSign },
        { to: "/finances",      labelKey: "finances",         icon: faChartBar },
        { to: "/communication", labelKey: "notifications",    icon: faBell },
        { to: "/fournisseurs",  labelKey: "fournisseurs",     icon: faTruck },
      ],
    },
    {
      sectionKey: "rapports",
      items: [
        { to: "/rapports", labelKey: "statistiques",    icon: faChartBar },
        { to: "/relances", labelKey: "relancesAmendes", icon: faTriangleExclamation },
      ],
    },
    {
      sectionKey: "compte",
      items: [
        { to: "/profil", labelKey: "monCompte", icon: faUser },
      ],
    },
  ],

  BIBLIOTHECAIRE: [
    {
      sectionKey: "principal",
      items: [
        { to: "/dashboard", labelKey: "tableauDeBord", icon: faGaugeHigh },
      ],
    },
    {
      sectionKey: "livres",
      items: [
        { to: "/livres",                 labelKey: "catalogueLivres",  icon: faBookOpen },
        { to: "/livres?vue=exemplaires", labelKey: "exemplaires",      icon: faBookmark },
        { to: "/livres?vue=recherche",   labelKey: "rechercheAvancee", icon: faMagnifyingGlass },
        { to: "/acquisitions",           labelKey: "acquisitions",     icon: faCartShopping },
        { to: "/periodiques",            labelKey: "periodiques",      icon: faNewspaper },
      ],
    },
    {
      sectionKey: "lecteurs",
      items: [
        { to: "/utilisateurs", labelKey: "lecteurs",       icon: faUsers },
        { to: "/emprunts",     labelKey: "empruntsRetours", icon: faClipboardList },
        { to: "/reservations", labelKey: "reservations",   icon: faCalendarCheck },
        { to: "/abonnement",   labelKey: "abonnements",    icon: faDollarSign },
        { to: "/relances",     labelKey: "relances",       icon: faTriangleExclamation },
        { to: "/fournisseurs", labelKey: "fournisseurs",   icon: faTruck },
      ],
    },
    {
      sectionKey: "suivi",
      items: [
        { to: "/communication", labelKey: "notifications", icon: faBell },
        { to: "/rapports",      labelKey: "statistiques",  icon: faChartBar },
      ],
    },
    {
      sectionKey: "compte",
      items: [
        { to: "/profil", labelKey: "monProfil", icon: faUser },
      ],
    },
  ],

  ENSEIGNANT: [
    {
      sectionKey: "principal",
      items: [
        { to: "/dashboard", labelKey: "accueil", icon: faHouse },
      ],
    },
    {
      sectionKey: "catalogue",
      items: [
        { to: "/livres?vue=recherche", labelKey: "rechercher",     icon: faMagnifyingGlass },
        { to: "/livres",               labelKey: "catalogueLivres", icon: faBookOpen },
        { to: "/acquisitions",         labelKey: "suggererTitre",  icon: faCartShopping },
      ],
    },
    {
      sectionKey: "mesEmprunts",
      items: [
        { to: "/emprunts?moi=1",        labelKey: "empruntsEnCours",  icon: faClipboardList },
        { to: "/reservations?moi=1",    labelKey: "mesReservations", icon: faCalendarCheck },
        { to: "/emprunts?historique=1", labelKey: "monHistorique",   icon: faClockRotateLeft },
      ],
    },
    {
      sectionKey: "compte",
      items: [
        { to: "/espace-membre",  labelKey: "espaceMembre",   icon: faIdCard },
        { to: "/communication",  labelKey: "notifications",  icon: faBell },
        { to: "/abonnement",     labelKey: "monAbonnement",  icon: faDollarSign },
        { to: "/profil",         labelKey: "monProfil",      icon: faUser },
      ],
    },
  ],

  ETUDIANT: [
    {
      sectionKey: "principal",
      items: [
        { to: "/dashboard", labelKey: "accueil", icon: faHouse },
      ],
    },
    {
      sectionKey: "catalogue",
      items: [
        { to: "/livres?vue=recherche", labelKey: "rechercher",     icon: faMagnifyingGlass },
        { to: "/livres",               labelKey: "catalogueLivres", icon: faBookOpen },
        { to: "/acquisitions",         labelKey: "suggererTitre",  icon: faCartShopping },
      ],
    },
    {
      sectionKey: "mesEmprunts",
      items: [
        { to: "/emprunts?moi=1",        labelKey: "empruntsEnCours",  icon: faClipboardList },
        { to: "/reservations?moi=1",    labelKey: "mesReservations", icon: faCalendarCheck },
        { to: "/emprunts?historique=1", labelKey: "monHistorique",   icon: faClockRotateLeft },
      ],
    },
    {
      sectionKey: "compte",
      items: [
        { to: "/espace-membre",  labelKey: "espaceMembre",   icon: faIdCard },
        { to: "/communication",  labelKey: "notifications",  icon: faBell },
        { to: "/abonnement",     labelKey: "monAbonnement",  icon: faDollarSign },
        { to: "/profil",         labelKey: "monProfil",      icon: faUser },
      ],
    },
  ],

  PUBLIC: [
    {
      sectionKey: "principal",
      items: [
        { to: "/dashboard", labelKey: "accueil", icon: faHouse },
      ],
    },
    {
      sectionKey: "catalogue",
      items: [
        { to: "/livres?vue=recherche", labelKey: "rechercher",       icon: faMagnifyingGlass },
        { to: "/livres?disponible=1",  labelKey: "livresDisponibles", icon: faBookOpen },
      ],
    },
    {
      sectionKey: "mesEmprunts",
      items: [
        { to: "/emprunts?moi=1",        labelKey: "mesEmprunts",     icon: faClipboardList },
        { to: "/reservations?moi=1",    labelKey: "mesReservations", icon: faCalendarCheck },
        { to: "/emprunts?historique=1", labelKey: "monHistorique",   icon: faClockRotateLeft },
      ],
    },
    {
      sectionKey: "compte",
      items: [
        { to: "/espace-membre",  labelKey: "espaceMembre",   icon: faIdCard },
        { to: "/abonnement",     labelKey: "monAbonnement",  icon: faDollarSign },
        { to: "/communication",  labelKey: "notifications",  icon: faBell },
        { to: "/profil",         labelKey: "monProfil",      icon: faUser },
      ],
    },
  ],
};

// ── Tooltip collapsed ─────────────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.13 }}
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl"
          >
            {label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItemLink({ to, labelKey, icon, badge, collapsed }: NavItem & { collapsed: boolean }) {
  const t = useT();
  const label = (t.nav_items as Record<string, string>)[labelKey] ?? labelKey;
  const inner = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
          collapsed ? "justify-center p-2.5" : "px-3 py-2 text-sm"
        } ${
          isActive
            ? "bg-white/15 font-medium text-white shadow-sm"
            : "text-white/60 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-xl bg-white/15"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {isActive && !collapsed && (
            <motion.div
              layoutId="nav-active-bar"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
              style={{ background: "var(--color-accent)" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <FontAwesomeIcon
            icon={icon}
            style={{
              fontSize: collapsed ? 17 : 15,
              ...(isActive ? { color: "var(--color-accent)" } : {}),
            }}
            className={`relative z-10 shrink-0 transition-transform duration-200 ${
              isActive ? "scale-110" : "group-hover:scale-110"
            }`}
          />
          {!collapsed && <span className="relative z-10 truncate">{label}</span>}
          {badge && !collapsed && (
            <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
          {badge && collapsed && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return collapsed ? <Tooltip label={label}>{inner}</Tooltip> : inner;
}

// ── SystemGroup (design spécial pour la section Système) ─────────────────────
function SystemItemLink({ item }: { item: NavItem }) {
  const t = useT();
  const label = (t.nav_items as Record<string, string>)[item.labelKey] ?? item.labelKey;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200 ${
          isActive ? "bg-white/12 font-medium text-white" : "text-white/50 hover:bg-white/8 hover:text-white/80"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
            style={isActive ? { background: "var(--color-accent)", color: "var(--color-primary)" } : { background: "rgba(255,255,255,0.07)" }}
          >
            <FontAwesomeIcon icon={item.icon} style={{ fontSize: 11 }} />
          </span>
          <span className="truncate text-[13px]">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SystemGroup({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const [open, setOpen] = useState(true);
  const t = useT();
  const location = useLocation();
  const hasActive = items.some((i) => location.pathname === i.to.split("?")[0]);
  const sectionLabel = (t.nav as Record<string, string>)["systeme"] ?? "Système";

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {hasActive && <div className="mx-auto mb-1 h-px w-6 rounded-full bg-white/20" />}
        {items.map((item) => (
          <NavItemLink key={item.to + item.labelKey} {...item} collapsed={collapsed} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/4 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2 px-3 py-2.5 transition-colors hover:bg-white/5"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10">
          <FontAwesomeIcon icon={faGear} style={{ fontSize: 10 }} className="text-white/50" />
        </div>
        <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-widest text-white/50 transition-colors group-hover:text-white/75">
          {sectionLabel}
        </span>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 9 }} className="text-white/30 group-hover:text-white/50" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/6 px-2 pb-2 pt-1 space-y-0.5">
              {items.map((item) => (
                <SystemItemLink key={item.to + item.labelKey} item={item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function SectionGroup({ sectionKey, items, collapsed }: { sectionKey: string; items: NavItem[]; collapsed: boolean }) {
  const t = useT();
  const section = (t.nav as Record<string, string>)[sectionKey] ?? sectionKey;
  const location = useLocation();
  const hasActive = items.some((i) => location.pathname === i.to.split("?")[0]);
  const [open, setOpen] = useState(true);

  if (sectionKey === "systeme") return <SystemGroup items={items} collapsed={collapsed} />;

  return (
    <div className="space-y-0.5">
      {!collapsed ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/35 transition-colors group-hover:text-white/60">
            {section}
          </span>
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 10 }} className="text-white/30 group-hover:text-white/50" />
          </motion.div>
        </button>
      ) : (
        hasActive && <div className="mx-auto mb-1 h-px w-6 rounded-full bg-white/20" />
      )}

      <AnimatePresence initial={false}>
        {(open || collapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden space-y-0.5"
          >
            {items.map((item) => (
              <NavItemLink key={item.to + item.labelKey} {...item} collapsed={collapsed} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AppName & LogoutButton ───────────────────────────────────────────────────────────────────
function AppName() {
  const t = useT();
  return <p className="font-heading text-sm font-bold leading-tight text-white">{t.sidebar.appName}</p>;
}

function LogoutButton({ collapsed, logout }: { collapsed: boolean; logout: () => void }) {
  const t = useT();
  const label = t.nav_items.deconnexion;
  if (collapsed) {
    return (
      <Tooltip label={label}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="flex w-full items-center justify-center rounded-xl p-2.5 text-white/40 transition-colors hover:bg-red-500/15 hover:text-red-400"
        >
          <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 17 }} />
        </motion.button>
      </Tooltip>
    );
  }
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      onClick={logout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 transition-all hover:bg-red-500/10 hover:text-red-400"
    >
      <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 16 }} className="shrink-0" />
      <span>{label}</span>
    </motion.button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { logout, utilisateur } = useAuthStore();
  const { logoUrl } = useUiStore();
  const navigate = useNavigate();
  const role = utilisateur?.role as Role | undefined;
  const sections = role ? (NAV[role] ?? []) : [];
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/accueil", { replace: true });
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768 && !sidebarCollapsed) toggleSidebar();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sidebarCollapsed, toggleSidebar]);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 flex h-screen flex-col overflow-hidden"
      style={{
        background: "linear-gradient(160deg, var(--sidebar-from) 0%, var(--sidebar-mid) 60%, var(--sidebar-to) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        minWidth: sidebarCollapsed ? 72 : 260,
      }}
    >
      {/* Lueurs d'ambiance */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full opacity-10 blur-3xl" style={{ background: "var(--color-accent)" }} />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full opacity-5 blur-3xl" style={{ background: "var(--color-primary-light)" }} />
      </div>

      {/* Logo + Collapse */}
      <div className="relative flex items-center gap-3 border-b border-white/8 px-4 py-4">
        <motion.div
          whileHover={{ scale: 1.06, rotate: logoUrl ? 0 : 6 }}
          whileTap={{ scale: 0.94 }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-lg overflow-hidden"
          style={logoUrl ? {} : { background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))" }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: 17, color: "var(--color-primary)" }} />
          )}
        </motion.div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="min-w-0 flex-1"
            >
              <AppName />
              <p className="text-[11px] font-semibold tracking-wider" style={{ color: "var(--color-accent)" }}>ESTA</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-white/50 transition-colors hover:bg-white/15 hover:text-white"
        >
          <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 13 }} />
          </motion.div>
        </motion.button>
      </div>

      {/* Navigation */}
      <nav
        ref={scrollRef}
        className="relative flex-1 space-y-3 overflow-y-auto px-3 py-4 scrollbar-thin"
      >
        {sections.map((s) => (
          <SectionGroup key={s.sectionKey} sectionKey={s.sectionKey} items={s.items} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="relative border-t border-white/8 px-3 py-3">
        <LogoutButton collapsed={sidebarCollapsed} logout={handleLogout} />
      </div>
    </motion.aside>
  );
}
