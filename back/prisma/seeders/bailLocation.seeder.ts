import type { PrismaClient } from '../../src/generated/prisma/client.js';
import {
  StatutBail,
  StatutPaiement,
  StatutContrat,
  StatutDepot,
  StatutTransaction,
  TypePaiement,
  TypeEtatDesLieux,
  StatutEtatDesLieux,
  EtatElement,
  StatutLocataire,
} from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { pick, randomInt, randomBool, faker } from './utils/random.js';

const TARGET_COUNT = 25;
const PIECES_STANDARD = ['Salon', 'Chambre', 'Cuisine', 'Salle de bain'];
const ELEMENTS_STANDARD = ['Murs', 'Sol', 'Plafond', 'Portes et fenêtres'];

const STATUTS_PONDERES: readonly StatutBail[] = [
  ...Array(5).fill(StatutBail.ACTIF),
  StatutBail.EN_ATTENTE,
  StatutBail.EN_PREAVIS,
  StatutBail.TERMINE,
  StatutBail.RESILIE,
];

function typeBailPour(slug: string): string {
  if (['bureau', 'commerce'].includes(slug)) return 'Commercial';
  if (['appartement', 'villa', 'maison', 'studio', 'chambre'].includes(slug)) return 'Habitation';
  return 'Mixte';
}

function moisEntre(debut: Date, fin: Date): Date[] {
  const dates: Date[] = [];
  const courant = new Date(debut);
  while (courant < fin) {
    dates.push(new Date(courant));
    courant.setMonth(courant.getMonth() + 1);
  }
  return dates;
}

export class BailLocationSeeder implements Seeder {
  readonly name = 'BailLocationSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.bailLocation.count();
    if (existing >= TARGET_COUNT) {
      console.log(`  ℹ ${existing} baux déjà présents — étape ignorée`);
      return;
    }

    const proprietaires = await prisma.proprietaire.findMany({
      include: {
        biens: { where: { typeTransaction: { slug: 'location' } }, include: { typeLogement: true } },
        locataire: { where: { statut: StatutLocataire.ACTIF } },
      },
    });
    const modelesContrat = await prisma.modeleContrat.findMany();

    const eligibles = proprietaires.filter((p) => p.biens.length > 0 && p.locataire.length > 0);
    if (eligibles.length === 0) {
      console.log('  ⚠ Aucun propriétaire éligible (bien de location + locataire actif) — étape ignorée');
      return;
    }

    const now = new Date();

    for (let i = existing; i < TARGET_COUNT; i++) {
      const proprietaire = pick(eligibles);
      const bien = pick(proprietaire.biens);
      const locataire = pick(proprietaire.locataire);
      const statut = pick(STATUTS_PONDERES);
      const typeBail = typeBailPour(bien.typeLogement?.slug ?? '');

      const dureeMoisEcoules = randomInt(2, 18);
      const dateDebutBail = new Date(now);
      dateDebutBail.setMonth(dateDebutBail.getMonth() - dureeMoisEcoules);

      const estTermine = statut === StatutBail.TERMINE || statut === StatutBail.RESILIE;
      const dateFinBail = estTermine
        ? new Date(now.getTime() - randomInt(1, 60) * 24 * 3600 * 1000)
        : (randomBool(0.4) ? new Date(dateDebutBail.getTime() + 365 * 24 * 3600 * 1000) : null);

      const montantLoyer = bien.prix ? Math.round(bien.prix) : randomInt(50, 300) * 1000;
      const montantCaution = bien.caution ?? montantLoyer * 2;
      const cautionVersee = statut !== StatutBail.EN_ATTENTE;

      const bail = await prisma.bailLocation.create({
        data: {
          bienId: bien.id,
          locataireId: locataire.id,
          proprietaireId: proprietaire.id,
          typeBail,
          dateDebutBail,
          dateFinBail: dateFinBail ?? undefined,
          renouvellement: randomBool(0.3),
          montantLoyer,
          montantCaution,
          cautionVersee,
          jourLimitePaiement: randomInt(1, 10),
          delaiGrace: randomInt(3, 7),
          frequencePaiement: 'Mensuel',
          statut,
          motifResiliation: statut === StatutBail.RESILIE ? 'Non-paiement répété des loyers' : undefined,
          initiePar: 'PROPRIETAIRE',
        },
      });

      // Contrat associé
      const modele =
        modelesContrat.find((m) => m.typeBail === typeBail) ?? modelesContrat.find((m) => m.typeBail === null);
      if (modele) {
        await prisma.contrat.create({
          data: {
            bailId: bail.id,
            modeleId: modele.id,
            titre: modele.titre,
            contenu: modele.contenu,
            statut: estTermine ? StatutContrat.ARCHIVE : StatutContrat.ACTIF,
          },
        });
      }

      // Dépôt de caution
      if (cautionVersee) {
        await prisma.depotCaution.create({
          data: {
            bailId: bail.id,
            bienId: bien.id,
            proprietaireId: proprietaire.id,
            locataireId: locataire.id,
            montant: montantCaution,
            statut: estTermine ? StatutDepot.RESTITUE : StatutDepot.RECU,
            dateReception: dateDebutBail,
            dateRestitution: estTermine ? dateFinBail ?? undefined : undefined,
            montantRestitue: estTermine ? Math.round(montantCaution * 0.9) : undefined,
            motifRetenue: estTermine ? 'Frais de remise en état mineurs' : undefined,
          },
        });
      }

      // Échéancier de loyer
      const finEcheancier = dateFinBail ?? now;
      const echeances = moisEntre(dateDebutBail, statut === StatutBail.EN_ATTENTE ? dateDebutBail : (finEcheancier < now ? finEcheancier : now));

      for (const dateEcheance of echeances) {
        const estPassee = dateEcheance < now;
        const statutPaiement = estPassee
          ? pick<StatutPaiement>([StatutPaiement.PAYE, StatutPaiement.PAYE, StatutPaiement.PAYE, StatutPaiement.EN_RETARD])
          : StatutPaiement.A_VENIR;

        const echeance = await prisma.echeancierLoyer.create({
          data: {
            bailId: bail.id,
            bienId: bien.id,
            proprietaireId: proprietaire.id,
            locataireId: locataire.id,
            dateEcheance,
            montant: montantLoyer,
            statut: statutPaiement,
            datePaiement: statutPaiement === StatutPaiement.PAYE ? dateEcheance : undefined,
            modePaiement: statutPaiement === StatutPaiement.PAYE ? pick(['Wave', 'Orange Money', 'Virement bancaire']) : undefined,
            reference: statutPaiement === StatutPaiement.PAYE ? faker.string.alphanumeric(10).toUpperCase() : undefined,
            confirmeParProprietaire: statutPaiement === StatutPaiement.PAYE,
            dateConfirmation: statutPaiement === StatutPaiement.PAYE ? dateEcheance : undefined,
          },
        });

        if (statutPaiement === StatutPaiement.PAYE) {
          await prisma.quittance.create({
            data: {
              echeanceId: echeance.id,
              bailId: bail.id,
              bienId: bien.id,
              proprietaireId: proprietaire.id,
              locataireId: locataire.id,
              numero: `QT-${dateEcheance.getFullYear()}${String(dateEcheance.getMonth() + 1).padStart(2, '0')}-${bail.id.slice(0, 6)}`,
              dateGeneration: dateEcheance,
            },
          });

          await prisma.transaction.create({
            data: {
              proprietaireId: proprietaire.id,
              type: TypePaiement.PAIEMENT_LOYER,
              statut: StatutTransaction.CONFIRME,
              montant: montantLoyer,
              modePaiement: pick(['Wave', 'Orange Money', 'Virement bancaire']),
              provider: pick(['WAVE', 'ORANGE_MONEY', 'BANQUE']),
              reference: faker.string.alphanumeric(12).toUpperCase(),
              dateInitiation: dateEcheance,
              dateConfirmation: dateEcheance,
              bienId: bien.id,
              bailId: bail.id,
              echeanceId: echeance.id,
              locataireId: locataire.id,
            },
          });
        }
      }

      // État des lieux
      if (statut !== StatutBail.EN_ATTENTE) {
        await this.creerEtatDesLieux(prisma, bail.id, bien.id, proprietaire.id, locataire.id, TypeEtatDesLieux.ENTREE, StatutEtatDesLieux.VALIDE);
        if (estTermine) {
          await this.creerEtatDesLieux(prisma, bail.id, bien.id, proprietaire.id, locataire.id, TypeEtatDesLieux.SORTIE, StatutEtatDesLieux.VALIDE);
        }
      }

      console.log(`  ✔ Bail : ${bien.titre ?? bien.id} — ${locataire.prenom} ${locataire.nom} (${statut})`);
    }
  }

  private async creerEtatDesLieux(
    prisma: PrismaClient,
    bailId: string,
    bienId: string,
    proprietaireId: string,
    locataireId: string,
    type: TypeEtatDesLieux,
    statut: StatutEtatDesLieux
  ): Promise<void> {
    const etat = await prisma.etatDesLieux.create({
      data: {
        bailId,
        bienId,
        proprietaireId,
        locataireId,
        type,
        statut,
        nbCles: randomInt(1, 3),
        dateValidation: statut === StatutEtatDesLieux.VALIDE ? new Date() : undefined,
      },
    });

    for (const nomPiece of PIECES_STANDARD) {
      const piece = await prisma.pieceEtatDesLieux.create({
        data: { etatDesLieuxId: etat.id, nom: nomPiece },
      });

      await prisma.elementEtatDesLieux.createMany({
        data: ELEMENTS_STANDARD.map((nomElement) => ({
          pieceId: piece.id,
          nom: nomElement,
          etat: pick(Object.values(EtatElement)),
        })),
      });
    }
  }
}
