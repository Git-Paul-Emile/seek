import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

export class ConfigSiteSeeder implements Seeder {
  readonly name = 'ConfigSiteSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    const existingConfig = await prisma.configSite.findUnique({
      where: { id: "config_site" },
    });

    if (existingConfig) {
      console.log(`  ℹ Configuration globale "config_site" déjà présente`);
      return;
    }

    const defaultHours = [
      { day: "lundi", isOpen: true, open: "08:00", close: "18:00" },
      { day: "mardi", isOpen: true, open: "08:00", close: "18:00" },
      { day: "mercredi", isOpen: true, open: "08:00", close: "18:00" },
      { day: "jeudi", isOpen: true, open: "08:00", close: "18:00" },
      { day: "vendredi", isOpen: true, open: "08:00", close: "18:00" },
      { day: "samedi", isOpen: true, open: "09:00", close: "18:00" },
      { day: "dimanche", isOpen: false, open: "09:00", close: "13:00" },
    ];

    await prisma.configSite.create({
      data: {
        id: "config_site",
        contactEmail: "contact@seek.sn",
        contactPhone: "+221 77 000 00 00",
        contactAddress: "Dakar, Sénégal",
        serviceClientHours: defaultHours,
      },
    });

    console.log(`  ✔ Configuration globale créée : config_site`);
  }
}
