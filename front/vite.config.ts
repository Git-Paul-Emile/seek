import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA abandonnée : ce service worker « autodestructeur » remplace l'ancien chez les visiteurs
    // qui l'avaient installé, le désinscrit et vide ses caches. À retirer quand plus personne
    // ne peut avoir l'ancienne version (quelques semaines après la mise en production).
    VitePWA({ selfDestroying: true, manifest: false }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-toast", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
          "vendor-charts": ["recharts"],
          "vendor-map": ["react-map-gl/mapbox", "mapbox-gl"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-editor": ["@tiptap/react", "@tiptap/starter-kit"],
          "vendor-utils": ["date-fns", "axios", "socket.io-client", "framer-motion"],
        },
      },
    },
  },
}));
