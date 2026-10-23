import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { TypeNotification, StatutNotification } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { pick, randomBool, pastDate } from './utils/random.js';

const NB_NOTIFICATIONS = 60;
const NB_MESSAGES_PROPRIETAIRE = 20;
const NB_MESSAGES_LOCATAIRE = 20;

const TYPES_NOTIFICATION = Object.values(TypeNotification);

export class MessagingSeeder implements Seeder {
  readonly name = 'MessagingSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const [echeances, proprietaires, locataires] = await Promise.all([
      prisma.echeancierLoyer.findMany(),
      prisma.proprietaire.findMany(),
      prisma.locataire.findMany(),
    ]);

    const existingNotifications = await prisma.notification.count();
    if (existingNotifications < NB_NOTIFICATIONS) {
      const data = Array.from({ length: NB_NOTIFICATIONS - existingNotifications }, () => {
        const echeance = echeances.length > 0 && randomBool(0.6) ? pick(echeances) : null;
        const envoye = randomBool(0.85);
        return {
          type: pick(TYPES_NOTIFICATION),
          canal: pick(['SMS', 'EMAIL']),
          destinataire: pick(proprietaires.length > 0 ? proprietaires.map((p) => p.telephone) : ['+221770000000']),
          sujet: 'Notification SEEK',
          contenu: 'Ceci est une notification générée automatiquement pour la démonstration.',
          statut: envoye ? StatutNotification.ENVOYE : pick([StatutNotification.EN_ATTENTE, StatutNotification.ECHEC]),
          echeanceId: echeance?.id,
          bailId: echeance?.bailId,
          bienId: echeance?.bienId,
          proprietaireId: echeance?.proprietaireId ?? (proprietaires.length > 0 ? pick(proprietaires).id : undefined),
          locataireId: echeance?.locataireId,
          envoyeAt: envoye ? pastDate(60) : undefined,
          lu: randomBool(0.5),
        };
      });
      await prisma.notification.createMany({ data });
      console.log(`  ✔ ${data.length} notifications créées`);
    } else {
      console.log(`  ℹ ${existingNotifications} notifications déjà présentes — étape ignorée`);
    }

    const existingMsgProprio = await prisma.messageInterne.count();
    if (existingMsgProprio < NB_MESSAGES_PROPRIETAIRE && proprietaires.length > 0) {
      const data = Array.from({ length: NB_MESSAGES_PROPRIETAIRE - existingMsgProprio }, () => ({
        proprietaireId: pick(proprietaires).id,
        titre: pick(['Rappel de paiement', 'Nouvelle candidature', 'Mise à jour du bail', 'Information importante']),
        corps: 'Message interne généré pour la démonstration de la plateforme SEEK.',
        type: pick(['INFO', 'ALERTE', 'RAPPEL']),
        lu: randomBool(0.5),
      }));
      await prisma.messageInterne.createMany({ data });
      console.log(`  ✔ ${data.length} messages internes (propriétaires) créés`);
    } else {
      console.log(`  ℹ ${existingMsgProprio} messages internes propriétaires déjà présents — étape ignorée`);
    }

    const existingMsgLocataire = await prisma.messageInterneLocataire.count();
    if (existingMsgLocataire < NB_MESSAGES_LOCATAIRE && locataires.length > 0) {
      const data = Array.from({ length: NB_MESSAGES_LOCATAIRE - existingMsgLocataire }, () => ({
        locataireId: pick(locataires).id,
        titre: pick(['Quittance disponible', 'Rappel de loyer', 'État des lieux', 'Information importante']),
        corps: 'Message interne généré pour la démonstration de la plateforme SEEK.',
        type: pick(['INFO', 'ALERTE', 'RAPPEL']),
        lu: randomBool(0.5),
      }));
      await prisma.messageInterneLocataire.createMany({ data });
      console.log(`  ✔ ${data.length} messages internes (locataires) créés`);
    } else {
      console.log(`  ℹ ${existingMsgLocataire} messages internes locataires déjà présents — étape ignorée`);
    }
  }
}
