import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

interface TypeLogementData {
  nom: string;
  slug: string;
  image: string;
  ordre: number;
}

const TYPES_LOGEMENT: readonly TypeLogementData[] = [
  {
    nom: 'Appartement',
    slug: 'appartement',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80&auto=format&fit=crop',
    ordre: 1,
  },
  {
    nom: 'Villa',
    slug: 'villa',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80&auto=format&fit=crop',
    ordre: 2,
  },
  {
    nom: 'Studio',
    slug: 'studio',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80&auto=format&fit=crop',
    ordre: 3,
  },
  {
    nom: 'Maison',
    slug: 'maison',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80&auto=format&fit=crop',
    ordre: 4,
  },
  {
    nom: 'Terrain',
    slug: 'terrain',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80&auto=format&fit=crop',
    ordre: 5,
  },
  {
    nom: 'Commerce',
    slug: 'commerce',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80&auto=format&fit=crop',
    ordre: 6,
  },
  {
    nom: 'Bureau',
    slug: 'bureau',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80&auto=format&fit=crop',
    ordre: 7,
  },
  {
    nom: 'Immeuble',
    slug: 'immeuble',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80&auto=format&fit=crop',
    ordre: 8,
  },
  {
    nom: 'Chambre',
    slug: 'chambre',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=80&auto=format&fit=crop',
    ordre: 9,
  },
  {
    nom: 'Espace événementiel',
    slug: 'espace-evenementiel',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80&auto=format&fit=crop',
    ordre: 10,
  },
];

export class TypeLogementSeeder implements Seeder {
  readonly name = 'TypeLogementSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    for (const type of TYPES_LOGEMENT) {
      await prisma.typeLogement.upsert({
        where:  { slug: type.slug },
        update: { nom: type.nom, image: type.image, ordre: type.ordre },
        create: { ...type, actif: true },
      });
      console.log(`  ✔ Type : ${type.nom}`);
    }
  }
}
