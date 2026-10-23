import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

const UN_JOUR_S = 24 * 60 * 60;
const MAX_BUNDLE_PRECACHE_BYTES = 5 * 1024 * 1024;

// Seules les lectures publiques sont mises en cache pour le hors ligne : jamais les routes
// authentifiées (propriétaire, locataire, admin, compte), qui portent des données personnelles.
const API_PUBLIQUE = [
  /\/api\/biens\/public\//,
  /\/api\/types-logement\/?$/,
  /\/api\/temoignages\/?$/,
  /\/api\/config-site\/?$/,
  /\/api\/premium\/accueil/,
  /\/api\/equipements\/?$/,
];

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
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Seek, l'immobilier au Sénégal",
        short_name: "Seek",
        description: "Trouvez, louez, gérez. Annonces vérifiées, prix affichés en FCFA, alertes SMS.",
        lang: "fr",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0A5C43",
        background_color: "#0A5C43",
        categories: ["lifestyle", "business"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Rechercher", url: "/annonces", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Mes favoris", url: "/favoris", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Publier une annonce", url: "/proprietaires", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        // Précache limité à la coque (HTML, CSS, JS courant, polices, icônes) : quelques centaines
        // de Ko au premier passage. Les bibliothèques lourdes et les grandes images des espaces
        // propriétaire et admin sont mises en cache à leur première utilisation (règle seek-assets).
        globPatterns: ["**/*.{js,css,html,svg,woff2}", "icons/*.png"],
        globIgnores: [
          "**/vendor-map-*.js",
          "**/vendor-charts-*.js",
          "**/vendor-editor-*.js",
          "**/jspdf*.js",
          "**/html2canvas*.js",
          "**/generateQuittance-*.js",
          "**/index.es-*.js",
        ],
        maximumFileSizeToCacheInBytes: MAX_BUNDLE_PRECACHE_BYTES,
        navigateFallback: "/index.html",
        // Les fonctions Vercel (/api/og) et le backend ne doivent pas recevoir la coque de l'app.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Fichiers de build hors précache : noms versionnés, donc immuables.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "seek-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * UN_JOUR_S },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Annonces et listes publiques : réseau d'abord, cache si hors ligne ou réseau lent.
            urlPattern: ({ url, request }) =>
              request.method === "GET" && API_PUBLIQUE.some((motif) => motif.test(url.pathname)),
            handler: "NetworkFirst",
            options: {
              cacheName: "seek-api-publique",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * UN_JOUR_S },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Photos des annonces (Cloudinary et autres hébergeurs d'images).
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "seek-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * UN_JOUR_S },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
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
