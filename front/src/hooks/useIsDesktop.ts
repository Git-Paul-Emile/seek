import { useSyncExternalStore } from "react";

// Points de rupture de Tailwind : `lg` (en dessous, l'interface suit les maquettes mobiles)
// et `xl` (place pour un panneau latéral à côté d'un tableau).
const DESKTOP_QUERY = "(min-width: 1024px)";
const LARGE_DESKTOP_QUERY = "(min-width: 1280px)";

const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/** Vrai sur grand écran. Sert à ne monter qu'un seul composant lourd (carte) selon l'écran. */
export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY);

/** Vrai à partir de 1 280 px, quand un panneau de décision tient à droite d'un tableau. */
export const useIsLargeDesktop = () => useMediaQuery(LARGE_DESKTOP_QUERY);
