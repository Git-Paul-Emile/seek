import bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { StatutLocataire } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';
import { faker, senegalPhone, pickMany } from './utils/random.js';

const NB_LIES_LOCATAIRE = 8;
const NB_LIES_PROPRIETAIRE = 5;
const NB_VISITEURS = 7;

export class ComptePublicSeeder implements Seeder {
  readonly name = 'ComptePublicSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existing = await prisma.comptePublic.count();
    if (existing >= NB_LIES_LOCATAIRE + NB_LIES_PROPRIETAIRE + NB_VISITEURS) {
      console.log(`  ℹ ${existing} comptes publics déjà présents — étape ignorée`);
      return;
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT ?? '10', 10);
    const hashedPassword = await bcrypt.hash('Public@2024!', saltRounds);

    const locatairesActifs = await prisma.locataire.findMany({
      where: { statut: StatutLocataire.ACTIF, comptePublic: null },
    });
    const proprietaires = await prisma.proprietaire.findMany({ where: { comptePublic: null } });

    for (const locataire of pickMany(locatairesActifs, NB_LIES_LOCATAIRE)) {
      await prisma.comptePublic.create({
        data: {
          nom: locataire.nom,
          prenom: locataire.prenom,
          telephone: senegalPhone(),
          email: faker.internet.email({ firstName: locataire.prenom, lastName: locataire.nom }).toLowerCase(),
          password: hashedPassword,
          locataireId: locataire.id,
        },
      });
      console.log(`  ✔ Compte public lié au locataire : ${locataire.prenom} ${locataire.nom}`);
    }

    for (const proprietaire of pickMany(proprietaires, NB_LIES_PROPRIETAIRE)) {
      await prisma.comptePublic.create({
        data: {
          nom: proprietaire.nom,
          prenom: proprietaire.prenom,
          telephone: senegalPhone(),
          email: faker.internet.email({ firstName: proprietaire.prenom, lastName: proprietaire.nom }).toLowerCase(),
          password: hashedPassword,
          proprietaireId: proprietaire.id,
        },
      });
      console.log(`  ✔ Compte public lié au propriétaire : ${proprietaire.prenom} ${proprietaire.nom}`);
    }

    for (let i = 0; i < NB_VISITEURS; i++) {
      const prenom = faker.person.firstName();
      const nom = faker.person.lastName();
      await prisma.comptePublic.create({
        data: {
          nom,
          prenom,
          telephone: senegalPhone(),
          email: faker.internet.email({ firstName: prenom, lastName: nom }).toLowerCase(),
          password: hashedPassword,
        },
      });
      console.log(`  ✔ Compte public visiteur : ${prenom} ${nom}`);
    }
  }
}
