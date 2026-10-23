import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { StatutLocataire, StatutVerificationLocataire, TypePieceIdentite } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { faker, senegalPhone, randomInt, randomBool, pastDate, futureDate } from './utils/random.js';

const TARGET_COUNT = 30;
export const DEFAULT_LOCATAIRE_PASSWORD = 'Locataire@2024!';

const STATUTS_PONDERES: readonly StatutLocataire[] = [
  ...Array(6).fill(StatutLocataire.ACTIF),
  ...Array(2).fill(StatutLocataire.INVITE),
  StatutLocataire.INACTIF,
  StatutLocataire.ANCIEN,
];

export class LocataireSeeder implements Seeder {
  readonly name = 'LocataireSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.locataire.count();
    if (existing >= TARGET_COUNT) {
      console.log(`  ℹ ${existing} locataires déjà présents — étape ignorée`);
      return;
    }

    const proprietaires = await prisma.proprietaire.findMany();
    if (proprietaires.length === 0) {
      throw new Error('LocataireSeeder : aucun propriétaire trouvé — exécutez ProprietaireSeeder en premier.');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT ?? '10', 10);
    const hashedPassword = await bcrypt.hash(DEFAULT_LOCATAIRE_PASSWORD, saltRounds);

    for (let i = existing; i < TARGET_COUNT; i++) {
      const proprietaire = faker.helpers.arrayElement(proprietaires);
      const sexe = randomBool() ? 'M' : 'F';
      const prenom = sexe === 'M' ? faker.person.firstName('male') : faker.person.firstName('female');
      const nom = faker.person.lastName();
      const statut = faker.helpers.arrayElement(STATUTS_PONDERES);
      const estActif = statut === StatutLocataire.ACTIF || statut === StatutLocataire.ANCIEN;

      const locataire = await prisma.locataire.create({
        data: {
          proprietaireId: proprietaire.id,
          nom,
          prenom,
          telephone: senegalPhone(),
          email: faker.internet.email({ firstName: prenom, lastName: nom }).toLowerCase(),
          nbOccupants: randomInt(1, 6),
          presenceEnfants: randomBool(0.4),
          dateNaissance: faker.date.birthdate({ min: 20, max: 65, mode: 'age' }),
          lieuNaissance: faker.location.city(),
          nationalite: randomBool(0.85) ? 'Sénégalaise' : faker.location.country(),
          sexe,
          numPieceIdentite: faker.string.numeric(13),
          typePiece: TypePieceIdentite.CNI,
          dateDelivrance: pastDate(1800),
          dateExpirationPiece: futureDate(1800),
          autoriteDelivrance: 'Préfecture de Dakar',
          situationProfessionnelle: faker.person.jobTitle(),
          activationToken: statut === StatutLocataire.INVITE ? crypto.randomUUID() : null,
          tokenExpiresAt: statut === StatutLocataire.INVITE ? futureDate(7) : null,
          statut,
          password: estActif ? hashedPassword : null,
          estSuspendu: false,
        },
      });

      if (estActif && randomBool(0.6)) {
        const statutVerif = faker.helpers.arrayElement([
          StatutVerificationLocataire.VERIFIED,
          StatutVerificationLocataire.VERIFIED,
          StatutVerificationLocataire.PENDING,
          StatutVerificationLocataire.NOT_VERIFIED,
        ]);
        await prisma.locataireVerification.create({
          data: {
            locataireId: locataire.id,
            typePiece: 'CNI',
            pieceIdentiteRecto: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            pieceIdentiteVerso: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            selfie: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            statut: statutVerif,
            conditionsAcceptees: true,
            traitePar: statutVerif !== StatutVerificationLocataire.NOT_VERIFIED ? 'admin@seek.sn' : undefined,
            dateTraitement: statutVerif !== StatutVerificationLocataire.NOT_VERIFIED ? pastDate(90) : undefined,
          },
        });
      }

      console.log(`  ✔ Locataire : ${prenom} ${nom} (${statut})`);
    }
  }
}
