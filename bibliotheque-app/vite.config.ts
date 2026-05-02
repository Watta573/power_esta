import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/* // @ts-expect-error process is a nodejs global */
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL && process.env.VITE_API_BASE_URL.startsWith("http")
          ? process.env.VITE_API_BASE_URL
          : "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("scheduler")) return "react-core";
            if (id.includes("react-router") || id.includes("@remix-run")) return "router";
            if (id.includes("@base-ui") || id.includes("@floating-ui")) return "ui-core";
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "forms";
            if (id.includes("axios") || id.includes("date-fns") || id.includes("sonner")) return "utils";
            if (id.includes("recharts") || id.includes("d3-")) return "charts";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("jspdf")) return "pdf-export";
            if (id.includes("xlsx")) return "excel-export";
            return "vendor";
          }
        },
      },
    },
  },
}));
