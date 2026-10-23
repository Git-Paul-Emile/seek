import type { PrismaClient } from '../../src/generated/prisma/client.js';

/**
 * Contrat commun pour tous les seeders.
 *
 * Chaque seeder reçoit le client Prisma en injection de dépendance
 * et expose une unique méthode `run`.
 *
 * Principes SOLID appliqués :
 *  - S : chaque implémentation gère une seule entité
 *  - O : ajouter un seeder = nouveau fichier, zéro modification de l'existant
 *  - D : dépendance sur une abstraction (PrismaClient), pas sur un singleton global
 */
export interface Seeder {
  readonly name: string;
  run(prisma: PrismaClient): Promise<void>;
}
