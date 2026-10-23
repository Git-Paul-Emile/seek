import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { MotifSignalement, StatutSignalement, StatutAlerte } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { faker, pick, pickMany, randomInt, senegalPhone, pastDate } from './utils/random.js';

const NB_FAVORIS = 50;
const NB_VUES = 200;
const NB_SIGNALEMENTS = 12;
const NB_ALERTES = 15;

export class EngagementSeeder implements Seeder {
  readonly name = 'EngagementSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const [comptesPublics, biens] = await Promise.all([
      prisma.comptePublic.findMany(),
      prisma.bien.findMany({ where: { actif: true } }),
    ]);

    if (comptesPublics.length === 0 || biens.length === 0) {
      throw new Error('EngagementSeeder : comptes publics ou biens introuvables.');
    }

    const existingFavoris = await prisma.favori.count();
    if (existingFavoris < NB_FAVORIS) {
      let created = 0;
      let attempts = 0;
      while (created < NB_FAVORIS - existingFavoris && attempts < NB_FAVORIS * 3) {
        attempts++;
        const compte = pick(comptesPublics);
        const bien = pick(biens);
        try {
          await prisma.favori.create({
            data: {
              comptePublicId: compte.id,
              bienId: bien.id,
              prixSnapshot: bien.prix ?? undefined,
              statutSnapshot: bien.statutAnnonce,
              actifSnapshot: bien.actif,
            },
          });
          created++;
        } catch {
          // doublon (comptePublicId, bienId) déjà existant — on ignore
        }
      }
      console.log(`  ✔ ${created} favoris créés`);
    } else {
      console.log(`  ℹ ${existingFavoris} favoris déjà présents — étape ignorée`);
    }

    const existingVues = await prisma.vueBien.count();
    if (existingVues < NB_VUES) {
      const data = Array.from({ length: NB_VUES - existingVues }, () => ({
        bienId: pick(biens).id,
        ipAddress: faker.internet.ipv4(),
        createdAt: pastDate(90),
      }));
      await prisma.vueBien.createMany({ data });
      console.log(`  ✔ ${data.length} vues créées`);
    } else {
      console.log(`  ℹ ${existingVues} vues déjà présentes — étape ignorée`);
    }

    const existingSignalements = await prisma.signalement.count();
    if (existingSignalements < NB_SIGNALEMENTS) {
      const motifs = Object.values(MotifSignalement);
      for (let i = existingSignalements; i < NB_SIGNALEMENTS; i++) {
        const bien = pick(biens);
        const traite = Math.random() < 0.5;
        await prisma.signalement.create({
          data: {
            bienId: bien.id,
            comptePublicId: pick(comptesPublics).id,
            nom: faker.person.fullName(),
            telephone: senegalPhone(),
            motif: pick(motifs),
            commentaire: faker.lorem.sentence(),
            statut: traite ? pick([StatutSignalement.VALIDE, StatutSignalement.REJETE]) : StatutSignalement.EN_ATTENTE,
            traitePar: traite ? 'admin@seek.sn' : undefined,
            dateTraitement: traite ? pastDate(30) : undefined,
          },
        });
      }
      console.log(`  ✔ ${NB_SIGNALEMENTS - existingSignalements} signalements créés`);
    } else {
      console.log(`  ℹ ${existingSignalements} signalements déjà présents — étape ignorée`);
    }

    const existingAlertes = await prisma.alerte.count();
    if (existingAlertes < NB_ALERTES) {
      const villes = [...new Set(biens.map((b) => b.ville).filter((v): v is string => !!v))];
      const typesLogement = await prisma.typeLogement.findMany();
      const typesTransaction = await prisma.typeTransaction.findMany();

      for (let i = existingAlertes; i < NB_ALERTES; i++) {
        const avecCompte = Math.random() < 0.6;
        const prixMin = randomInt(50, 300) * 1000;
        await prisma.alerte.create({
          data: {
            telephone: senegalPhone(),
            comptePublicId: avecCompte ? pick(comptesPublics).id : undefined,
            ville: pick(villes),
            typeLogement: pick(typesLogement).nom,
            typeTransaction: pick(typesTransaction).nom,
            prixMin,
            prixMax: prixMin + randomInt(50, 300) * 1000,
            canalPrefere: pick(['SMS', 'EMAIL']),
            statut: pick([StatutAlerte.ACTIVE, StatutAlerte.ACTIVE, StatutAlerte.DESACTIVE]),
          },
        });
      }
      console.log(`  ✔ ${NB_ALERTES - existingAlertes} alertes créées`);
    } else {
      console.log(`  ℹ ${existingAlertes} alertes déjà présentes — étape ignorée`);
    }
  }
}
