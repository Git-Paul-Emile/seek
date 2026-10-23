/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { TemoignageSeeder } from './seeders/temoignage.seeder.js';

dotenv.config();

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Exécution du TemoignageSeeder...\n');

    const seeder = new TemoignageSeeder();
    console.log(`▶ ${seeder.name}`);
    await seeder.run(prisma);

    console.log('\n🎉 Seeding témoignages terminé avec succès !');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Erreur lors du seeding :', err);
  process.exit(1);
});
