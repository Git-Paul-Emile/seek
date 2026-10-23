// Annonces déjà consultées par ce visiteur, pour griser leur marqueur sur la carte
// (planche « Recherche et carte » : « déjà vu en gris »). Confort local au navigateur :
// la page fonctionne normalement si le stockage est indisponible.

const STORAGE_KEY = "seek_annonces_vues";
const MAX_VUES = 200;

export function lireAnnoncesVues(): Set<string> {
  try {
    const brut = localStorage.getItem(STORAGE_KEY);
    return new Set(brut ? (JSON.parse(brut) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function marquerAnnonceVue(id: string): void {
  try {
    const vues = [...lireAnnoncesVues()].filter((v) => v !== id);
    vues.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vues.slice(-MAX_VUES)));
  } catch {
    // Stockage bloqué (navigation privée) : on se passe de l'information.
  }
}
