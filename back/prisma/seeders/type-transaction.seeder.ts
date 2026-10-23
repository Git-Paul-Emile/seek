import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const TYPES: readonly { nom: string; slug: string; ordre: number }[] = [
  { nom: 'Location', slug: 'location', ordre: 1 },
  { nom: 'Vente',    slug: 'vente',    ordre: 2 },
];

export class TypeTransactionSeeder implements Seeder {
  readonly name = 'TypeTransactionSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    for (const type of TYPES) {
      await prisma.typeTransaction.upsert({
        where:  { slug: type.slug },
        update: { nom: type.nom, ordre: type.ordre },
        create: { ...type, actif: true },
      });
      console.log(`  ✔ Type de transaction : ${type.nom}`);
    }
  }
}
