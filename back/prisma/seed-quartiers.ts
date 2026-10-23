/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { QuartierSeeder } from './seeders/quartier.seeder.js';

dotenv.config();

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    console.log('🌱 Seeding quartiers du Sénégal...\n');
    const seeder = new QuartierSeeder();
    console.log(`▶ ${seeder.name}`);
    await seeder.run(prisma);
    console.log('\n🎉 Seeding quartiers terminé !');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
