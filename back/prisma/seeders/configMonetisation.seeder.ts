import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const ID_CONFIG = 'config';

export class ConfigMonetisationSeeder implements Seeder {
  readonly name = 'ConfigMonetisationSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    await prisma.configMonetisation.upsert({
      where: { id: ID_CONFIG },
      update: {},
      create: {
        id: ID_CONFIG,
        miseEnAvantActive: true,
        commissionActive: false,
        tauxCommission: 0,
      },
    });
    console.log('  ✔ Configuration de monétisation créée');
  }
}
