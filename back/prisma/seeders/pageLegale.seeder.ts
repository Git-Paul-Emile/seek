import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const PAGES: readonly { slug: string; titre: string; contenu: string; version: string }[] = [
  {
    slug: 'mentions-legales',
    titre: 'Mentions légales',
    contenu: '<h1>Mentions légales</h1><p>SEEK est une plateforme de gestion locative et d\'annonces immobilières basée au Sénégal.</p>',
    version: '1.0',
  },
  {
    slug: 'politique-de-confidentialite',
    titre: 'Politique de confidentialité',
    contenu: '<h1>Politique de confidentialité</h1><p>Cette page décrit la collecte et le traitement des données personnelles sur SEEK.</p>',
    version: '1.0',
  },
  {
    slug: 'conditions-generales-utilisation',
    titre: "Conditions générales d'utilisation",
    contenu: '<h1>Conditions générales d\'utilisation</h1><p>En utilisant SEEK, vous acceptez les présentes conditions.</p>',
    version: '1.0',
  },
];

export class PageLegaleSeeder implements Seeder {
  readonly name = 'PageLegaleSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    for (const page of PAGES) {
      await prisma.pageLegale.upsert({
        where: { slug: page.slug },
        update: { titre: page.titre, contenu: page.contenu, version: page.version },
        create: { ...page, publie: true },
      });
      console.log(`  ✔ Page légale : ${page.titre}`);
    }
  }
}
