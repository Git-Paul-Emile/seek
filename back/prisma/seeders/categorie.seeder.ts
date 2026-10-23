import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

// Catégories de meubles
const CATEGORIES_MEUBLES = [
  'Salon',
  'Chambre',
  'Cuisine',
  'Salle de bain',
  'Bureau',
  'Local commercial',
];

// Catégories d'équipements
const CATEGORIES_EQUIPEMENTS = [
  'Salon',
  'Chambre',
  'Cuisine',
  'Salle de bain',
  'Bureau',
  'Équipements généraux',
  'Local commercial',
  'Immeuble',
];

export class CategorieSeeder implements Seeder {
  readonly name = 'CategorieSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    // Créer les catégories de meubles
    for (const nom of CATEGORIES_MEUBLES) {
      await prisma.categorieMeuble.upsert({
        where: { nom },
        update: { actif: true },
        create: { nom, slug: nom.toLowerCase().replace(/[^a-z0-9]/g, '-'), actif: true },
      });
      console.log(`  ✔ Catégorie Meuble : ${nom}`);
    }

    // Créer les catégories d'équipements
    for (const nom of CATEGORIES_EQUIPEMENTS) {
      await prisma.categorieEquipement.upsert({
        where: { nom },
        update: { actif: true },
        create: { nom, slug: nom.toLowerCase().replace(/[^a-z0-9]/g, '-'), actif: true },
      });
      console.log(`  ✔ Catégorie Équipement : ${nom}`);
    }
  }
}
