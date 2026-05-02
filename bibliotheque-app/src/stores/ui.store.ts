import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

export interface TemplateTokens {
  primary: string;
  primaryLight: string;
  primaryPale: string;
  accent: string;
  accentDark: string;
  sidebarFrom: string;
  sidebarTo: string;
  sidebarMid: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
  radius: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tokens: TemplateTokens;
  builtIn: boolean;
}

export const BUILT_IN_TEMPLATES: AppTemplate[] = [
  // 1 — Forêt (défaut)
  {
    id: "foret",
    name: "Forêt",
    description: "Vert profond & or — thème par défaut",
    emoji: "🌿",
    builtIn: true,
    tokens: {
      primary: "#1b4332", primaryLight: "#2d6a4f", primaryPale: "#d8f3dc",
      accent: "#e9c46a", accentDark: "#c9a227",
      sidebarFrom: "#1b4332", sidebarMid: "#0d2b1f", sidebarTo: "#081a13",
      danger: "#e63946", success: "#2d6a4f", warning: "#e9c46a", info: "#457b9d",
      radius: "10px",
    },
  },
  // 2 — Figma
  {
    id: "figma",
    name: "Figma",
    description: "Violet & rose — inspiré de Figma",
    emoji: "🎨",
    builtIn: true,
    tokens: {
      primary: "#7c3aed", primaryLight: "#8b5cf6", primaryPale: "#ede9fe",
      accent: "#f472b6", accentDark: "#db2777",
      sidebarFrom: "#1e1b4b", sidebarMid: "#13103a", sidebarTo: "#0a0820",
      danger: "#ef4444", success: "#10b981", warning: "#f59e0b", info: "#8b5cf6",
      radius: "8px",
    },
  },
  // 3 — Claude (Anthropic)
  {
    id: "claude",
    name: "Claude",
    description: "Sable chaud & orange — inspiré de Claude",
    emoji: "🤖",
    builtIn: true,
    tokens: {
      primary: "#c96442", primaryLight: "#e07a5f", primaryPale: "#fdf0eb",
      accent: "#f4a261", accentDark: "#e76f51",
      sidebarFrom: "#2d1b0e", sidebarMid: "#1e1108", sidebarTo: "#120a04",
      danger: "#dc2626", success: "#16a34a", warning: "#f4a261", info: "#0ea5e9",
      radius: "12px",
    },
  },
  // 4 — Linear
  {
    id: "linear",
    name: "Linear",
    description: "Indigo profond & blanc — inspiré de Linear",
    emoji: "⚡",
    builtIn: true,
    tokens: {
      primary: "#5e6ad2", primaryLight: "#7c85e0", primaryPale: "#eef0fb",
      accent: "#a8b4ff", accentDark: "#5e6ad2",
      sidebarFrom: "#16161e", sidebarMid: "#0e0e14", sidebarTo: "#08080c",
      danger: "#f2555a", success: "#26b5a0", warning: "#f2a84e", info: "#5e6ad2",
      radius: "6px",
    },
  },
  // 5 — Notion
  {
    id: "notion",
    name: "Notion",
    description: "Noir & blanc minimaliste — inspiré de Notion",
    emoji: "📝",
    builtIn: true,
    tokens: {
      primary: "#191919", primaryLight: "#37352f", primaryPale: "#f7f6f3",
      accent: "#2eaadc", accentDark: "#0b6e99",
      sidebarFrom: "#191919", sidebarMid: "#111111", sidebarTo: "#080808",
      danger: "#e03e3e", success: "#0f7b6c", warning: "#dfab01", info: "#2eaadc",
      radius: "4px",
    },
  },
  // 6 — Vercel
  {
    id: "vercel",
    name: "Vercel",
    description: "Noir absolu & blanc — inspiré de Vercel",
    emoji: "▲",
    builtIn: true,
    tokens: {
      primary: "#000000", primaryLight: "#333333", primaryPale: "#fafafa",
      accent: "#0070f3", accentDark: "#0050b3",
      sidebarFrom: "#000000", sidebarMid: "#0a0a0a", sidebarTo: "#111111",
      danger: "#ff0000", success: "#00c853", warning: "#ff9800", info: "#0070f3",
      radius: "6px",
    },
  },
  // 7 — Océan
  {
    id: "ocean",
    name: "Océan",
    description: "Bleu marine & cyan — calme et professionnel",
    emoji: "🌊",
    builtIn: true,
    tokens: {
      primary: "#1e3a5f", primaryLight: "#2e5f9e", primaryPale: "#dbeafe",
      accent: "#38bdf8", accentDark: "#0284c7",
      sidebarFrom: "#1e3a5f", sidebarMid: "#122340", sidebarTo: "#0a1628",
      danger: "#ef4444", success: "#10b981", warning: "#f59e0b", info: "#38bdf8",
      radius: "10px",
    },
  },
  // 8 — Bordeaux
  {
    id: "bordeaux",
    name: "Bordeaux",
    description: "Rouge bordeaux & or — élégance académique",
    emoji: "🍷",
    builtIn: true,
    tokens: {
      primary: "#6b1a2a", primaryLight: "#9b2335", primaryPale: "#fce7ea",
      accent: "#d4a853", accentDark: "#b8892e",
      sidebarFrom: "#6b1a2a", sidebarMid: "#4a1020", sidebarTo: "#2d0a14",
      danger: "#dc2626", success: "#16a34a", warning: "#d97706", info: "#2563eb",
      radius: "8px",
    },
  },
  // 9 — Ardoise
  {
    id: "ardoise",
    name: "Ardoise",
    description: "Gris ardoise & violet — moderne et épuré",
    emoji: "🪨",
    builtIn: true,
    tokens: {
      primary: "#334155", primaryLight: "#475569", primaryPale: "#e2e8f0",
      accent: "#a78bfa", accentDark: "#7c3aed",
      sidebarFrom: "#1e293b", sidebarMid: "#0f172a", sidebarTo: "#080f1a",
      danger: "#f43f5e", success: "#22c55e", warning: "#eab308", info: "#6366f1",
      radius: "12px",
    },
  },
  // 10 — Sable
  {
    id: "sable",
    name: "Sable",
    description: "Brun chaud & terracotta — chaleureux",
    emoji: "🏜️",
    builtIn: true,
    tokens: {
      primary: "#7c4a1e", primaryLight: "#a0622a", primaryPale: "#fef3e2",
      accent: "#f97316", accentDark: "#c2410c",
      sidebarFrom: "#7c4a1e", sidebarMid: "#4e2e10", sidebarTo: "#2d1a08",
      danger: "#dc2626", success: "#15803d", warning: "#f97316", info: "#0369a1",
      radius: "8px",
    },
  },
];

interface UiState {
  sidebarCollapsed: boolean;
  themeMode: ThemeMode;
  templateId: string;
  customTemplates: AppTemplate[];
  templatePanelOpen: boolean;
  logoUrl: string | null;

  toggleSidebar: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setTemplate: (id: string) => void;
  addCustomTemplate: (tpl: AppTemplate) => void;
  removeCustomTemplate: (id: string) => void;
  setTemplatePanelOpen: (open: boolean) => void;
  setLogoUrl: (url: string | null) => void;

  // Compat ancien code
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      themeMode: "light",
      templateId: "foret",
      customTemplates: [],
      templatePanelOpen: false,
      logoUrl: null,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleThemeMode: () => set((s) => ({ themeMode: s.themeMode === "light" ? "dark" : "light" })),
      setTemplate: (id) => set({ templateId: id }),
      addCustomTemplate: (tpl) => set((s) => ({ customTemplates: [...s.customTemplates.filter((t) => t.id !== tpl.id), tpl] })),
      removeCustomTemplate: (id) => set((s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) })),
      setTemplatePanelOpen: (open) => set({ templatePanelOpen: open }),
      setLogoUrl: (url) => set({ logoUrl: url }),

      // Compat
      get theme() { return get().themeMode; },
      setTheme: (theme) => set({ themeMode: theme }),
    }),
    { name: "ui-storage-v2" },
  ),
);

// Helper : résoudre le template actif
export function resolveTemplate(state: Pick<UiState, "templateId" | "customTemplates">): AppTemplate {
  const all = [...BUILT_IN_TEMPLATES, ...state.customTemplates];
  return all.find((t) => t.id === state.templateId) ?? BUILT_IN_TEMPLATES[0];
}
