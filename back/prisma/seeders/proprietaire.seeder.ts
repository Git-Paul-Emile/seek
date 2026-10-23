import bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { StatutVerification } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { faker, senegalPhone, randomBool, pastDate } from './utils/random.js';

const TARGET_COUNT = 15;
export const DEFAULT_PROPRIETAIRE_PASSWORD = 'Proprio@2024!';

export class ProprietaireSeeder implements Seeder {
  readonly name = 'ProprietaireSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.proprietaire.count();
    if (existing >= TARGET_COUNT) {
      console.log(`  ℹ ${existing} propriétaires déjà présents — étape ignorée`);
      return;
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT ?? '10', 10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PROPRIETAIRE_PASSWORD, saltRounds);

    for (let i = existing; i < TARGET_COUNT; i++) {
      const sexe = randomBool() ? 'M' : 'F';
      const prenom = sexe === 'M' ? faker.person.firstName('male') : faker.person.firstName('female');
      const nom = faker.person.lastName();
      const estVerifie = randomBool(0.6);

      const proprietaire = await prisma.proprietaire.create({
        data: {
          prenom,
          nom,
          sexe,
          telephone: senegalPhone(),
          email: faker.internet.email({ firstName: prenom, lastName: nom }).toLowerCase(),
          password: hashedPassword,
          statutVerification: estVerifie ? StatutVerification.VERIFIED : StatutVerification.NOT_VERIFIED,
          verifiedAt: estVerifie ? pastDate(180) : null,
          telephoneVerifie: estVerifie,
          canauxNotification: randomBool(0.7) ? ['SMS'] : ['SMS', 'EMAIL'],
        },
      });

      if (estVerifie) {
        await prisma.verificationDocuments.create({
          data: {
            proprietaireId: proprietaire.id,
            typePiece: 'CNI',
            pieceIdentiteRecto: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            pieceIdentiteVerso: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            selfie: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            conditionsAcceptees: true,
            traitePar: 'admin@seek.sn',
            dateTraitement: pastDate(150),
          },
        });
      }

      console.log(`  ✔ Propriétaire : ${prenom} ${nom}`);
    }
  }
}
