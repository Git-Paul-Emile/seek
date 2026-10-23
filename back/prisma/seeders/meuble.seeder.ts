import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const MEUBLES: readonly { nom: string; categorie: string }[] = [
  // ── SALON / ESPACE DE VIE ────────────────────────────────────────────────
  { nom: 'Canapé',         categorie: 'Salon' },
  { nom: 'Fauteuil',       categorie: 'Salon' },
  { nom: 'Table basse',    categorie: 'Salon' },
  { nom: 'Meuble TV',      categorie: 'Salon' },
  { nom: 'Bibliothèque',   categorie: 'Salon' },
  { nom: 'Rideaux',        categorie: 'Salon' },
  { nom: 'Tapis',          categorie: 'Salon' },
  { nom: 'Table à manger', categorie: 'Salon' },
  { nom: 'Chaises',        categorie: 'Salon' },

  // ── CHAMBRE ──────────────────────────────────────────────────────────────
  { nom: 'Lit simple',       categorie: 'Chambre' },
  { nom: 'Lit double',       categorie: 'Chambre' },
  { nom: 'Lit king size',    categorie: 'Chambre' },
  { nom: 'Matelas',          categorie: 'Chambre' },
  { nom: 'Armoire',          categorie: 'Chambre' },
  { nom: 'Dressing',         categorie: 'Chambre' },
  { nom: 'Commode',          categorie: 'Chambre' },
  { nom: 'Table de chevet',  categorie: 'Chambre' },
  { nom: 'Miroir',           categorie: 'Chambre' },

  // ── CUISINE ──────────────────────────────────────────────────────────────
  { nom: 'Placards de rangement', categorie: 'Cuisine' },
  { nom: 'Plan de travail',       categorie: 'Cuisine' },

  // ── SALLE DE BAIN ────────────────────────────────────────────────────────
  { nom: 'Miroir', categorie: 'Salle de bain' },

  // ── BUREAU / ESPACE PROFESSIONNEL ────────────────────────────────────────
  { nom: 'Bureau de travail',      categorie: 'Bureau' },
  { nom: 'Chaise de bureau',       categorie: 'Bureau' },
  { nom: 'Table de réunion',       categorie: 'Bureau' },
  { nom: 'Armoires de rangement',  categorie: 'Bureau' },
  { nom: 'Étagères',               categorie: 'Bureau' },
  { nom: 'Accueil / comptoir',     categorie: 'Bureau' },

  // ── LOCAL COMMERCIAL ─────────────────────────────────────────────────────
  { nom: 'Comptoir',    categorie: 'Local commercial' },
  { nom: 'Rayonnages',  categorie: 'Local commercial' },
];

export class MeubleSeeder implements Seeder {
  readonly name = 'MeubleSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    // First, get all categories to map name to ID
    const categories = await prisma.categorieMeuble.findMany();
    const categorieMap = new Map(categories.map(c => [c.nom, c.id]));

    const meubleIds: string[] = [];
    for (const meuble of MEUBLES) {
      const categorieId = categorieMap.get(meuble.categorie);
      if (!categorieId) {
        console.log(`  ⚠ Catégorie introuvable : ${meuble.categorie}`);
        continue;
      }

      const created = await prisma.meuble.upsert({
        where:  { nom_categorieId: { nom: meuble.nom, categorieId } },
        update: { actif: true },
        create: { nom: meuble.nom, categorieId, actif: true },
      });
      meubleIds.push(created.id);
      console.log(`  ✔ Meuble [${meuble.categorie}] : ${meuble.nom}`);
    }

    // Rattache chaque meuble à tous les types de logement existants, pour ne rien
    // casser côté formulaire "Ajout de bien" : l'admin peut ensuite retirer ce qui
    // ne s'applique pas à un type donné depuis /admin/biens/types/:id/champs.
    const typeLogements = await prisma.typeLogement.findMany({ select: { id: true } });
    for (const { id: typeLogementId } of typeLogements) {
      for (const meubleId of meubleIds) {
        await prisma.typeLogementMeuble.upsert({
          where: { typeLogementId_meubleId: { typeLogementId, meubleId } },
          update: {},
          create: { typeLogementId, meubleId },
        });
      }
    }
  }
}
