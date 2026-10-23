import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const TEMOIGNAGES = [
  {
    nom: 'Marie Dubois',
    profession: 'Cadre RH',
    temoignage:
      "Seek a révolutionné ma recherche de logement. En quelques clics, j'ai trouvé l'appartement parfait à Dakar. L'interface est intuitive et les annonces sont toujours à jour. Je recommande fortement cette plateforme à tous ceux qui cherchent un chez-soi au Sénégal.",
    ordre: 1,
  },
  {
    nom: 'Cheikh Fall',
    profession: 'Propriétaire',
    temoignage:
      "Propriétaire depuis 2 ans sur Seek, je suis séduit par la facilité de gestion de mes biens. L'espace locataire est très pratique et les paiements sont sécurisés. Le service client est réactif et toujours disponible pour m'accompagner. Une plateforme incontournable pour l'immobilier au Sénégal.",
    ordre: 2,
  },
  {
    nom: 'Fatou Diallo',
    profession: 'Jeune professionnelle',
    temoignage:
      "En tant que jeune professionnelle, trouver un logement me paraissait impossible avant de découvrir Seek. La qualité des annonces et la fiabilité des informations m'ont permis de louer mon premier appartement en toute confiance. Merci Seek pour cette belle expérience !",
    ordre: 3,
  },
  {
    nom: 'Ibrahima Sow',
    profession: 'Ingénieur informatique',
    temoignage:
      "J'ai utilisé Seek pour trouver un bureau pour mon entreprise à Dakar. Le filtrage par type de bien et par quartier m'a fait gagner un temps précieux. La transparence des annonces est vraiment appréciable. Je n'hésiterai pas à revenir pour mes prochains projets immobiliers.",
    ordre: 4,
  },
  {
    nom: 'Aminata Traoré',
    profession: 'Enseignante',
    temoignage:
      "Grâce à Seek, j'ai pu trouver un logement proche de mon école en moins d'une semaine. Les photos détaillées et les informations précises sur chaque bien m'ont aidée à faire le bon choix sans me déplacer inutilement. Une expérience vraiment positive !",
    ordre: 5,
  },
  {
    nom: 'Moussa Diop',
    profession: 'Entrepreneur',
    temoignage:
      "Seek m'a permis de gérer mes propriétés de façon professionnelle. La gestion des baux, le suivi des paiements et la communication avec mes locataires sont désormais centralisés. C'est exactement ce dont j'avais besoin pour développer mon activité immobilière au Sénégal.",
    ordre: 6,
  },
];

export class TemoignageSeeder implements Seeder {
  readonly name = 'TemoignageSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    for (const temoin of TEMOIGNAGES) {
      const existing = await prisma.temoignage.findFirst({
        where: { nom: temoin.nom },
      });

      if (existing) {
        await prisma.temoignage.update({
          where: { id: existing.id },
          data: { ...temoin, actif: true },
        });
      } else {
        await prisma.temoignage.create({
          data: { ...temoin, actif: true },
        });
      }

      console.log(`  ✔ Témoignage : ${temoin.nom}`);
    }
  }
}
