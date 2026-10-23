// Référence courte d'un bien, affichée en JetBrains Mono (charte : « Réf. 4F2A9C1B »).
// Dérivée de l'identifiant tant que la base ne stocke pas de référence dédiée.

const LONGUEUR_REFERENCE = 8;

export const referenceBien = (bienId: string): string =>
  bienId.replace(/-/g, "").slice(0, LONGUEUR_REFERENCE).toUpperCase();
