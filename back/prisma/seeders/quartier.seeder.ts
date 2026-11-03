import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';
import { limiter } from './utils/limite.js';
import { VILLES_SENEGAL } from './data/villes-senegal.data.js';
import { QUARTIERS_SENEGAL } from './data/quartiers-senegal.data.js';

const CODE_PAYS_SENEGAL = 'SN';

/** Taille des lots d'insertion — borne le nombre de paramètres envoyés à PostgreSQL. */
const TAILLE_LOT = 500;

/**
 * Insère les quartiers des villes seedées (LIMITE_SEED quartiers maximum par ville).
 *
 * Idempotent et non destructif :
 *  - les quartiers obsolètes d'une ville sont supprimés UNIQUEMENT s'ils ne
 *    sont référencés par aucun bien, ce qui évite toute violation de clé
 *    étrangère et toute perte d'annonce existante ;
 *  - l'insertion s'appuie sur la contrainte @@unique([nom, villeId]) via
 *    `skipDuplicates`, donc une réexécution n'introduit aucun doublon.
 */
export class QuartierSeeder implements Seeder {
  readonly name = 'QuartierSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const pays = await prisma.pays.findUnique({
      where: { code: CODE_PAYS_SENEGAL },
    });

    if (!pays) {
      throw new Error(
        `QuartierSeeder : pays "${CODE_PAYS_SENEGAL}" introuvable. ` +
        'Exécutez PaysSeeder et VilleSeeder en premier.'
      );
    }

    // Une seule requête pour toutes les villes, au lieu d'un findFirst par ville.
    const villes = await prisma.ville.findMany({
      where:  { paysId: pays.id },
      select: { id: true, nom: true },
    });
    const idParNom = new Map(villes.map((v) => [v.nom, v.id]));

    let totalInsere = 0;
    let totalIgnore = 0;
    let totalSupprime = 0;
    const villesIntrouvables: string[] = [];

    const villesSeedees = new Set(limiter(VILLES_SENEGAL).map((v) => v.nom));
    const entrees = QUARTIERS_SENEGAL.filter((e) => villesSeedees.has(e.ville));

    for (const entree of entrees) {
      const villeId = idParNom.get(entree.ville);
      const quartiers = limiter(entree.quartiers);

      if (!villeId) {
        villesIntrouvables.push(entree.ville);
        totalIgnore += quartiers.length;
        continue;
      }

      const { count: supprimes } = await prisma.quartier.deleteMany({
        where: { villeId, biens: { none: {} } },
      });
      totalSupprime += supprimes;

      for (let i = 0; i < quartiers.length; i += TAILLE_LOT) {
        const lot = quartiers.slice(i, i + TAILLE_LOT).map((q) => ({
          nom:       q.nom,
          villeId,
          latitude:  q.latitude,
          longitude: q.longitude,
        }));

        const { count } = await prisma.quartier.createMany({
          data: lot,
          skipDuplicates: true,
        });
        totalInsere += count;
      }
    }

    if (villesIntrouvables.length > 0) {
      console.log(
        `  ⚠ ${villesIntrouvables.length} villes introuvables — quartiers ignorés : ` +
        villesIntrouvables.slice(0, 5).join(', ') +
        (villesIntrouvables.length > 5 ? '…' : '')
      );
    }

    const total = await prisma.quartier.count();
    console.log(
      `  ✔ ${totalInsere} quartiers insérés, ${totalSupprime} obsolètes supprimés, ` +
      `${totalIgnore} ignorés → ${total} en base`
    );
  }
}
