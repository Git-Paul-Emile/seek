/**
 * Volume maximal inséré par seeder pour les listes de référence volumineuses
 * (villes, quartiers par ville, meubles, équipements). Garde un seed rapide
 * sur une base distante, tout en couvrant chaque parcours de l'application.
 */
export const LIMITE_SEED = 10;

export function limiter<T>(items: readonly T[], max = LIMITE_SEED): readonly T[] {
  return items.slice(0, max);
}
