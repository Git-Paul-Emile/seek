import crypto from 'node:crypto';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';
import { pick, pastDate } from './utils/random.js';

function fakeTokenHash(): string {
  return crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex');
}

/**
 * Ces tables ne contiennent normalement que des sessions réelles créées à la connexion.
 * On y insère ici quelques jetons expirés/révoqués factices afin qu'aucune table ne
 * reste vide en environnement de démonstration — ils ne permettent aucune connexion.
 */
export class SessionArtifactsSeeder implements Seeder {
  readonly name = 'SessionArtifactsSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const [admin, proprietaires, locataires, comptesPublics] = await Promise.all([
      prisma.admin.findFirst(),
      prisma.proprietaire.findMany({ take: 5 }),
      prisma.locataire.findMany({ take: 5 }),
      prisma.comptePublic.findMany({ take: 5 }),
    ]);

    const expiresAt = pastDate(1);
    const revokedAt = pastDate(1);

    if (admin && (await prisma.refreshToken.count()) === 0) {
      await prisma.refreshToken.createMany({
        data: [
          { adminId: admin.id, tokenHash: fakeTokenHash(), expiresAt, revokedAt },
          { adminId: admin.id, tokenHash: fakeTokenHash(), expiresAt, revokedAt },
        ],
      });
      console.log('  ✔ Jetons de session (Admin) créés');
    }

    if (proprietaires.length > 0) {
      if ((await prisma.proprietaireRefreshToken.count()) === 0) {
        await prisma.proprietaireRefreshToken.createMany({
          data: proprietaires.map((p) => ({ proprietaireId: p.id, tokenHash: fakeTokenHash(), expiresAt, revokedAt })),
        });
        console.log('  ✔ Jetons de session (Propriétaires) créés');
      }
      if ((await prisma.passwordResetToken.count()) === 0) {
        await prisma.passwordResetToken.createMany({
          data: [
            { proprietaireId: pick(proprietaires).id, tokenHash: fakeTokenHash(), expiresAt, usedAt: pastDate(1) },
          ],
        });
        console.log('  ✔ Jetons de réinitialisation (Propriétaires) créés');
      }
    }

    if (locataires.length > 0) {
      if ((await prisma.locataireRefreshToken.count()) === 0) {
        await prisma.locataireRefreshToken.createMany({
          data: locataires.map((l) => ({ locataireId: l.id, tokenHash: fakeTokenHash(), expiresAt, revokedAt })),
        });
        console.log('  ✔ Jetons de session (Locataires) créés');
      }
      if ((await prisma.locatairePasswordResetToken.count()) === 0) {
        await prisma.locatairePasswordResetToken.createMany({
          data: [
            { locataireId: pick(locataires).id, tokenHash: fakeTokenHash(), expiresAt, usedAt: pastDate(1) },
          ],
        });
        console.log('  ✔ Jetons de réinitialisation (Locataires) créés');
      }
    }

    if (comptesPublics.length > 0 && (await prisma.comptePublicRefreshToken.count()) === 0) {
      await prisma.comptePublicRefreshToken.createMany({
        data: comptesPublics.map((c) => ({ comptePublicId: c.id, tokenHash: fakeTokenHash(), expiresAt, revokedAt })),
      });
      console.log('  ✔ Jetons de session (Comptes publics) créés');
    }
  }
}
