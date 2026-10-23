import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';
import { VILLES_SENEGAL } from './data/villes-senegal.data.js';

const CODE_PAYS_SENEGAL = 'SN';

/**
 * Insère les 552 communes du Sénégal et leurs coordonnées.
 *
 * Idempotent : chaque ville est upsertée sur la clé unique [nom, paysId].
 * Une réexécution met simplement à jour les coordonnées, sans créer de doublon
 * ni casser les quartiers et les biens déjà rattachés.
 */
export class VilleSeeder implements Seeder {
  readonly name = 'VilleSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const pays = await prisma.pays.findUnique({
      where: { code: CODE_PAYS_SENEGAL },
    });

    if (!pays) {
      throw new Error(
        `VilleSeeder : pays avec le code "${CODE_PAYS_SENEGAL}" introuvable. ` +
        'Assurez-vous que PaysSeeder a été exécuté avant.'
      );
    }

    const avant = await prisma.ville.count({ where: { paysId: pays.id } });

    for (const ville of VILLES_SENEGAL) {
      await prisma.ville.upsert({
        where:  { nom_paysId: { nom: ville.nom, paysId: pays.id } },
        update: { latitude: ville.latitude, longitude: ville.longitude },
        create: {
          nom:       ville.nom,
          paysId:    pays.id,
          latitude:  ville.latitude,
          longitude: ville.longitude,
        },
      });
    }

    const total = await prisma.ville.count({ where: { paysId: pays.id } });
    console.log(
      `  ✔ ${total - avant} villes créées, ${VILLES_SENEGAL.length - (total - avant)} ` +
      `mises à jour / ${total} au total pour ${pays.nom}`
    );
  }
}
