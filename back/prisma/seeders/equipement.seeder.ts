import type { PrismaClient } from '../../src/generated/prisma/client.js';
import type { Seeder } from './seeder.interface.js';

const EQUIPEMENTS: readonly { nom: string; categorie: string }[] = [
  // ── SALON / ESPACE DE VIE ────────────────────────────────────────────────
  { nom: 'Télévision',         categorie: 'Salon' },
  { nom: 'Climatisation',      categorie: 'Salon' },
  { nom: 'Ventilateur',        categorie: 'Salon' },
  { nom: 'Lustre / luminaires', categorie: 'Salon' },

  // ── CHAMBRE ──────────────────────────────────────────────────────────────
  { nom: 'Climatisation', categorie: 'Chambre' },
  { nom: 'Ventilateur',   categorie: 'Chambre' },

  // ── CUISINE ──────────────────────────────────────────────────────────────
  { nom: 'Plaques de cuisson',  categorie: 'Cuisine' },
  { nom: 'Four',                categorie: 'Cuisine' },
  { nom: 'Micro-ondes',         categorie: 'Cuisine' },
  { nom: 'Réfrigérateur',       categorie: 'Cuisine' },
  { nom: 'Congélateur',         categorie: 'Cuisine' },
  { nom: 'Hotte aspirante',     categorie: 'Cuisine' },
  { nom: 'Évier',               categorie: 'Cuisine' },
  { nom: 'Lave-vaisselle',      categorie: 'Cuisine' },
  { nom: 'Machine à café',      categorie: 'Cuisine' },
  { nom: 'Gazinière',           categorie: 'Cuisine' },

  // ── SALLE DE BAIN ────────────────────────────────────────────────────────
  { nom: 'Baignoire',       categorie: 'Salle de bain' },
  { nom: 'Lavabo',          categorie: 'Salle de bain' },
  { nom: 'Chauffe-eau',     categorie: 'Salle de bain' },
  { nom: 'Machine à laver', categorie: 'Salle de bain' },

  // ── BUREAU / ESPACE PROFESSIONNEL ────────────────────────────────────────
  { nom: 'Climatisation',   categorie: 'Bureau' },
  { nom: 'Fibre internet',  categorie: 'Bureau' },
  { nom: 'Routeur',         categorie: 'Bureau' },
  { nom: 'Onduleur',        categorie: 'Bureau' },
  { nom: 'Vidéoprojecteur', categorie: 'Bureau' },

  // ── ÉQUIPEMENTS GÉNÉRAUX ─────────────────────────────────────────────────
  { nom: 'Groupe électrogène',       categorie: 'Équipements généraux' },
  { nom: 'Forage',                   categorie: 'Équipements généraux' },
  { nom: "Réservoir d'eau",          categorie: 'Équipements généraux' },
  { nom: 'Surpresseur',              categorie: 'Équipements généraux' },
  { nom: 'Caméras de surveillance',  categorie: 'Équipements généraux' },
  { nom: 'Interphone',               categorie: 'Équipements généraux' },
  { nom: 'Alarme',                   categorie: 'Équipements généraux' },
  { nom: 'Parking',                  categorie: 'Équipements généraux' },
  { nom: 'Garage',                   categorie: 'Équipements généraux' },
  { nom: 'Ascenseur',                categorie: 'Équipements généraux' },
  { nom: 'Gardien',                  categorie: 'Équipements généraux' },
  { nom: 'Clôture',                  categorie: 'Équipements généraux' },
  { nom: 'Portail électrique',       categorie: 'Équipements généraux' },
  { nom: 'Terrasse',                 categorie: 'Équipements généraux' },
  { nom: 'Balcon',                   categorie: 'Équipements généraux' },
  { nom: 'Jardin',                   categorie: 'Équipements généraux' },
  { nom: 'Piscine',                  categorie: 'Équipements généraux' },

  // ── LOCAL COMMERCIAL ─────────────────────────────────────────────────────
  { nom: 'Rideau métallique',  categorie: 'Local commercial' },
  { nom: 'Chambre froide',     categorie: 'Local commercial' },
  { nom: 'Extraction fumée',   categorie: 'Local commercial' },

  // ── IMMEUBLE ─────────────────────────────────────────────────────────────
  { nom: 'Local technique',    categorie: 'Immeuble' },
  { nom: 'Escalier de secours', categorie: 'Immeuble' },
  { nom: 'Local poubelle',     categorie: 'Immeuble' },
  { nom: 'Local gardien',      categorie: 'Immeuble' },
];

export class EquipementSeeder implements Seeder {
  readonly name = 'EquipementSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    // First, get all categories to map name to ID
    const categories = await prisma.categorieEquipement.findMany();
    const categorieMap = new Map(categories.map(c => [c.nom, c.id]));

    const equipementIds: string[] = [];
    for (const equipement of EQUIPEMENTS) {
      const categorieId = categorieMap.get(equipement.categorie);
      if (!categorieId) {
        console.log(`  ⚠ Catégorie introuvable : ${equipement.categorie}`);
        continue;
      }

      const created = await prisma.equipement.upsert({
        where:  { nom_categorieId: { nom: equipement.nom, categorieId } },
        update: { actif: true },
        create: { nom: equipement.nom, categorieId, actif: true },
      });
      equipementIds.push(created.id);
      console.log(`  ✔ Équipement [${equipement.categorie}] : ${equipement.nom}`);
    }

    // Rattache chaque équipement à tous les types de logement existants, pour ne
    // rien casser côté formulaire "Ajout de bien" : l'admin peut ensuite retirer
    // ce qui ne s'applique pas à un type donné depuis /admin/biens/types/:id/champs.
    const typeLogements = await prisma.typeLogement.findMany({ select: { id: true } });
    for (const { id: typeLogementId } of typeLogements) {
      for (const equipementId of equipementIds) {
        await prisma.typeLogementEquipement.upsert({
          where: { typeLogementId_equipementId: { typeLogementId, equipementId } },
          update: {},
          create: { typeLogementId, equipementId },
        });
      }
    }
  }
}
