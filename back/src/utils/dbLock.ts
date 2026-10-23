import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";

/**
 * Exécute `fn` à l'intérieur d'une transaction Postgres protégée par un verrou
 * consultatif (`pg_advisory_xact_lock`), acquis sur `key` (converti en entier
 * stable via `hashtext`). Le verrou est automatiquement relâché à la fin de la
 * transaction (commit ou rollback) — aucune migration de schéma requise.
 *
 * Sert à sérialiser les séquences "vérifier puis écrire" (ex : "ce bail a-t-il
 * déjà un échéancier ?", "existe-t-il déjà un bail actif sur ce bien ?") qui,
 * sans verrou, sont vulnérables à une course entre deux requêtes concurrentes.
 */
export const withAdvisoryLock = async <T>(
  key: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    return fn(tx);
  });
};
