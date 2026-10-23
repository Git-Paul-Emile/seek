import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { StatutAnnonce, TypeChamp } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { faker, pick, pickMany, randomInt, randomBool, pastDate, futureDate } from './utils/random.js';

const TARGET_COUNT = 60;

const STATUTS_PONDERES: readonly StatutAnnonce[] = [
  ...Array(6).fill(StatutAnnonce.PUBLIE),
  ...Array(2).fill(StatutAnnonce.EN_ATTENTE),
  StatutAnnonce.BROUILLON,
  StatutAnnonce.REJETE,
];

const ETABLISSEMENTS_TYPES = ['École', 'Hôpital', 'Marché', 'Pharmacie', 'Banque', 'Supermarché'];

function placeholderPhotos(seed: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/900/600`);
}

function randomValeurPourChamp(type: TypeChamp, options: string[]): string {
  switch (type) {
    case TypeChamp.BOOLEEN:
      return randomBool() ? 'true' : 'false';
    case TypeChamp.SELECT:
      return options.length > 0 ? pick(options) : '';
    case TypeChamp.NOMBRE:
      return String(randomInt(1, 20));
    case TypeChamp.SURFACE:
      return String(randomInt(1, 5));
    case TypeChamp.PRIX:
      return String(randomInt(1000, 100000));
    case TypeChamp.DATE:
      return pastDate(3650).toISOString();
    default:
      return faker.lorem.words(3);
  }
}

export class BienSeeder implements Seeder {
  readonly name = 'BienSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.bien.count();
    if (existing >= TARGET_COUNT) {
      console.log(`  ℹ ${existing} biens déjà présents — étape ignorée`);
      return;
    }

    const [proprietaires, quartiers, typeLogements, typeTransactions, statutBiens, equipements, meubles, typeLogementChamps] =
      await Promise.all([
        prisma.proprietaire.findMany(),
        prisma.quartier.findMany({ include: { ville: { include: { pays: true } } } }),
        prisma.typeLogement.findMany(),
        prisma.typeTransaction.findMany(),
        prisma.statutBien.findMany(),
        prisma.equipement.findMany(),
        prisma.meuble.findMany(),
        prisma.typeLogementChamp.findMany({ include: { champ: true } }),
      ]);

    if (proprietaires.length === 0 || quartiers.length === 0) {
      throw new Error('BienSeeder : propriétaires ou quartiers introuvables — exécutez les seeders précédents.');
    }

    const locationTx = typeTransactions.find((t) => t.slug === 'location');
    const venteTx = typeTransactions.find((t) => t.slug === 'vente');

    for (let i = existing; i < TARGET_COUNT; i++) {
      const proprietaire = pick(proprietaires);
      const quartier = pick(quartiers);
      const typeLogement = pick(typeLogements);
      const typeTransaction = pick(typeTransactions);
      const statutBien = pick(statutBiens);
      const statutAnnonce = pick(STATUTS_PONDERES);
      const estLocation = typeTransaction.id === locationTx?.id;
      const estPublie = statutAnnonce === StatutAnnonce.PUBLIE;
      const estHabitation = ['appartement', 'villa', 'maison', 'studio', 'chambre'].includes(typeLogement.slug);
      const estTerrain = typeLogement.slug === 'terrain';
      const estImmeuble = typeLogement.slug === 'immeuble';
      const estBureau = typeLogement.slug === 'bureau';
      const estCommerce = typeLogement.slug === 'commerce';

      const prix = estLocation
        ? randomInt(50, 800) * 1000
        : randomInt(5, 150) * 1_000_000;

      const estPremium = estPublie && randomBool(0.25);
      const aEuUneBaisse = randomBool(0.2);

      const bien = await prisma.bien.create({
        data: {
          titre: `${typeLogement.nom} ${estLocation ? 'à louer' : 'à vendre'} à ${quartier.nom}`,
          description: faker.lorem.paragraphs(2),
          typeLogementId: typeLogement.id,
          typeTransactionId: typeTransaction.id,
          statutBienId: statutBien.id,
          proprietaireId: proprietaire.id,
          pays: quartier.ville.pays.nom,
          region: quartier.ville.nom,
          ville: quartier.ville.nom,
          quartier: quartier.nom,
          quartierId: quartier.id,
          adresse: faker.location.streetAddress(),
          pointRepere: faker.lorem.words(4),
          latitude: quartier.latitude + (Math.random() - 0.5) * 0.01,
          longitude: quartier.longitude + (Math.random() - 0.5) * 0.01,
          surface: estTerrain ? undefined : randomInt(25, 400),
          surfaceParcelle: estTerrain ? randomInt(100, 2000) : undefined,
          nbChambres: estHabitation ? randomInt(1, 6) : undefined,
          nbSdb: estHabitation ? randomInt(1, 4) : undefined,
          nbSalons: estHabitation ? randomInt(1, 2) : undefined,
          nbCuisines: estHabitation ? 1 : undefined,
          etage: estHabitation || estBureau ? randomInt(0, 8) : undefined,
          nbEtages: estImmeuble ? randomInt(2, 10) : undefined,
          nbAppartements: estImmeuble ? randomInt(4, 40) : undefined,
          nbPieces: estBureau || estCommerce ? randomInt(1, 8) : undefined,
          nbWc: estHabitation ? randomInt(1, 3) : undefined,
          typeTerrain: estTerrain ? pick(['Résidentiel', 'Agricole', 'Commercial']) : undefined,
          cloture: estTerrain ? randomBool() : false,
          typeBureau: estBureau ? pick(['Open space', 'Bureaux fermés', 'Coworking']) : undefined,
          rideauMetallique: estCommerce ? randomBool() : false,
          meuble: estHabitation ? randomBool(0.4) : false,
          fumeurs: randomBool(0.5),
          animaux: randomBool(0.3),
          parking: randomBool(0.5),
          ascenseur: estImmeuble ? randomBool(0.5) : false,
          prix,
          // Le front n'affiche le badge « baisse de prix » que si la baisse est >= 5 %
          // ET que dateDerniereModificationPrix date de moins de 30 jours (cf. AnnonceDetail.tsx / PropertyCard.tsx).
          prixAncien: aEuUneBaisse ? Math.round(prix * (1 + randomInt(8, 25) / 100)) : undefined,
          dateDerniereModificationPrix: aEuUneBaisse ? pastDate(25) : undefined,
          frequencePaiement: estLocation ? pick(['Mensuel', 'Trimestriel', 'Annuel']) : undefined,
          chargesIncluses: estLocation ? randomBool(0.3) : false,
          caution: estLocation ? prix * randomInt(1, 2) : undefined,
          disponibleLe: futureDate(60),
          photos: placeholderPhotos(`bien-${i}`, randomInt(3, 8)),
          nbVues: randomInt(0, 500),
          nbFavoris: randomInt(0, 40),
          actif: statutAnnonce !== StatutAnnonce.ANNULE,
          statutAnnonce,
          estPremium,
          estMisEnAvant: estPremium && randomBool(0.5),
          dateDebutPromotion: estPremium ? pastDate(10) : undefined,
          dateFinPromotion: estPremium ? futureDate(20) : undefined,
          publishedAt: estPublie ? pastDate(120) : undefined,
        },
      });

      const equipementsChoisis = pickMany(equipements, randomInt(4, 10));
      if (equipementsChoisis.length > 0) {
        await prisma.bienEquipement.createMany({
          data: equipementsChoisis.map((e) => ({ bienId: bien.id, equipementId: e.id })),
          skipDuplicates: true,
        });
      }

      const meublesChoisis = bien.meuble ? pickMany(meubles, randomInt(3, 8)) : [];
      if (meublesChoisis.length > 0) {
        await prisma.bienMeuble.createMany({
          data: meublesChoisis.map((m) => ({ bienId: bien.id, meubleId: m.id, quantite: randomInt(1, 3) })),
          skipDuplicates: true,
        });
      }

      if (randomBool(0.4)) {
        await prisma.documentBien.create({
          data: {
            bienId: bien.id,
            proprietaireId: proprietaire.id,
            nom: 'Titre foncier.pdf',
            type: 'application/pdf',
            url: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf',
            taille: randomInt(50_000, 2_000_000),
          },
        });
      }

      if (randomBool(0.7)) {
        const etablissements = pickMany(ETABLISSEMENTS_TYPES, randomInt(2, 4));
        await prisma.etablissement.createMany({
          data: etablissements.map((type) => ({
            bienId: bien.id,
            type,
            nom: `${type} ${faker.location.street()}`,
            latitude: quartier.latitude + (Math.random() - 0.5) * 0.02,
            longitude: quartier.longitude + (Math.random() - 0.5) * 0.02,
            distance: Math.round(Math.random() * 3000) / 1000,
          })),
        });
      }

      const champsApplicables = typeLogementChamps.filter((tlc) => tlc.typeLogementId === typeLogement.id);
      for (const tlc of champsApplicables) {
        if (!randomBool(0.6)) continue;
        await prisma.bienChampValeur.create({
          data: {
            bienId: bien.id,
            champId: tlc.champId,
            valeur: randomValeurPourChamp(tlc.champ.type, tlc.champ.options),
          },
        });
      }

      console.log(`  ✔ Bien : ${bien.titre}`);
    }
  }
}
