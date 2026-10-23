import bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const DEFAULT_EMAIL    = 'admin@seek.sn';
const DEFAULT_PASSWORD = 'Admin@2024!';
const DEFAULT_SALT     = 10;

export class AdminSeeder implements Seeder {
  readonly name = 'AdminSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const email       = process.env.SEED_ADMIN_EMAIL    ?? DEFAULT_EMAIL;
    const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
    const saltRounds  = parseInt(process.env.BCRYPT_SALT ?? String(DEFAULT_SALT), 10);

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });

    if (existingAdmin) {
      console.log(`  ℹ Admin "${email}" déjà présent — mot de passe non écrasé`);
      return;
    }

    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    await prisma.admin.create({
      data: { email, password: hashedPassword },
    });

    console.log(`  ✔ Admin créé : ${email}`);
    console.warn('  ⚠  Changez le mot de passe par défaut après la première connexion !');
  }
}
