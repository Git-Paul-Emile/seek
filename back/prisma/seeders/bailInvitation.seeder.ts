import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { StatutBailInvitation, StatutLocataire } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { pick, randomInt, randomBool, pastDate, futureDate } from './utils/random.js';

const TARGET_COUNT = 20;

const STATUTS_PONDERES: readonly StatutBailInvitation[] = [
  StatutBailInvitation.PENDING,
  StatutBailInvitation.PENDING,
  StatutBailInvitation.ACCEPTEE,
  StatutBailInvitation.ACCEPTEE,
  StatutBailInvitation.ACCEPTEE,
  StatutBailInvitation.REFUSEE,
  StatutBailInvitation.EXPIREE,
];

export class BailInvitationSeeder implements Seeder {
  readonly name = 'BailInvitationSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.bailInvitation.count();
    if (existing >= TARGET_COUNT) {
      console.log(`  ℹ ${existing} invitations de bail déjà présentes — étape ignorée`);
      return;
    }

    const proprietaires = await prisma.proprietaire.findMany({
      include: {
        biens: { where: { typeTransaction: { slug: 'location' } } },
        locataire: { where: { statut: { in: [StatutLocataire.ACTIF, StatutLocataire.INVITE] } } },
      },
    });

    const eligibles = proprietaires.filter((p) => p.biens.length > 0 && p.locataire.length > 0);
    if (eligibles.length === 0) {
      console.log('  ⚠ Aucun propriétaire éligible (bien de location + locataire) — étape ignorée');
      return;
    }

    for (let i = existing; i < TARGET_COUNT; i++) {
      const proprietaire = pick(eligibles);
      const bien = pick(proprietaire.biens);
      const locataire = pick(proprietaire.locataire);
      const statut = pick(STATUTS_PONDERES);
      const dateDebutBail = futureDate(30);

      await prisma.bailInvitation.create({
        data: {
          bienId: bien.id,
          locataireId: locataire.id,
          proprietaireId: proprietaire.id,
          typeBail: 'Habitation',
          dateDebutBail,
          dateFinBail: randomBool(0.5) ? undefined : new Date(dateDebutBail.getTime() + 365 * 24 * 3600 * 1000),
          montantLoyer: bien.prix ? Math.round(bien.prix) : randomInt(50, 300) * 1000,
          montantCaution: bien.caution ?? undefined,
          jourLimitePaiement: randomInt(1, 10),
          frequencePaiement: 'Mensuel',
          statut,
          expiresAt: statut === StatutBailInvitation.EXPIREE ? pastDate(5) : futureDate(14),
        },
      });
    }

    console.log(`  ✔ ${TARGET_COUNT - existing} invitations de bail créées`);
  }
}
