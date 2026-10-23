import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

interface PaysData {
  nom: string;
  code: string;
}

const PAYS_A_SEEDER: readonly PaysData[] = [
  { nom: 'Sénégal', code: 'SN' },
];

export class PaysSeeder implements Seeder {
  readonly name = 'PaysSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    for (const pays of PAYS_A_SEEDER) {
      await prisma.pays.upsert({
        where:  { code: pays.code },
        update: { nom: pays.nom },
        create: { nom: pays.nom, code: pays.code },
      });

      console.log(`  ✔ Pays : ${pays.nom} (${pays.code})`);
    }
  }
}
