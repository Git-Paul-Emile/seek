import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { StatutPromotion, TypePaiement, StatutTransaction } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { pick, faker, pastDate } from './utils/random.js';

export class PromotionHistorySeeder implements Seeder {
  readonly name = 'PromotionHistorySeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.promotionHistory.count();

    const biensPremium = await prisma.bien.findMany({ where: { estPremium: true } });
    if (biensPremium.length === 0) {
      console.log('  ⚠ Aucun bien premium — étape ignorée');
      return;
    }

    if (existing >= biensPremium.length) {
      console.log(`  ℹ ${existing} historiques de promotion déjà présents — étape ignorée`);
      return;
    }

    const formules = await prisma.formulePremium.findMany();
    let created = 0;

    for (const bien of biensPremium) {
      const dejaPresent = await prisma.promotionHistory.findFirst({ where: { bienId: bien.id } });
      if (dejaPresent) continue;

      const formule = pick(formules);
      const dateDebut = bien.dateDebutPromotion ?? pastDate(30);
      const dateFin = bien.dateFinPromotion ?? new Date(dateDebut.getTime() + formule.dureeJours * 24 * 3600 * 1000);
      const active = dateFin > new Date();

      const transaction = await prisma.transaction.create({
        data: {
          proprietaireId: bien.proprietaireId,
          type: TypePaiement.PAIEMENT_PREMIUM,
          statut: StatutTransaction.CONFIRME,
          montant: formule.prix,
          modePaiement: pick(['Wave', 'Orange Money']),
          provider: pick(['WAVE', 'ORANGE_MONEY']),
          reference: faker.string.alphanumeric(12).toUpperCase(),
          dateInitiation: dateDebut,
          dateConfirmation: dateDebut,
          bienId: bien.id,
        },
      });

      await prisma.promotionHistory.create({
        data: {
          bienId: bien.id,
          proprietaireId: bien.proprietaireId,
          transactionId: transaction.id,
          formuleId: formule.id,
          formuleNom: formule.nom,
          dureeJours: formule.dureeJours,
          montant: formule.prix,
          dateDebut,
          dateFin,
          dateFinReelle: active ? undefined : dateFin,
          modePaiement: transaction.modePaiement,
          reference: transaction.reference,
          confirmeParAdmin: true,
          dateConfirmation: dateDebut,
          statut: active ? StatutPromotion.ACTIVE : StatutPromotion.TERMINEE,
          joursRestants: active ? Math.max(0, Math.ceil((dateFin.getTime() - Date.now()) / (24 * 3600 * 1000))) : 0,
        },
      });

      created++;
    }

    console.log(`  ✔ ${created} historiques de promotion créés`);
  }
}
