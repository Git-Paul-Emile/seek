import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { TypeChamp } from '../../src/generated/prisma/enums.js';
import type { Seeder } from './seeder.interface.js';

interface ChampData {
  nom: string;
  type: TypeChamp;
  unite?: string;
  options?: string[];
  /** Liste de slugs typeLogement, ou '*' pour "tous les types existants au moment du seed" */
  typeLogements: string[] | '*';
  obligatoire?: boolean;
  /**
   * Quand renseigné, ce champ "système" pilote la visibilité par type de bien
   * d'une colonne statique de Bien (nbChambres, surface, etc.) au lieu d'être
   * stocké dans BienChampValeur. Voir AddBien.tsx / bienChampsAuthorization.service.ts.
   */
  cleSysteme?: string;
}

const CATEGORIES: readonly { nom: string; ordre: number; champs: ChampData[] }[] = [
  {
    // Champs "cœur" du formulaire, déjà existants en dur dans AddBien.tsx avant cette
    // évolution. Rattachés à '*' (tous les types) au seed pour ne rien casser ; l'admin
    // peut ensuite les désassocier par type depuis /admin/biens/types/:id/champs
    // (ex: retirer Chambres/Salles de bain pour "Terrain").
    nom: 'Caractéristiques principales',
    ordre: 0,
    champs: [
      { nom: 'Surface', type: TypeChamp.SURFACE, unite: 'm²', typeLogements: '*', obligatoire: true, cleSysteme: 'surface' },
      { nom: 'Étage', type: TypeChamp.NOMBRE, typeLogements: '*', cleSysteme: 'etage' },
      { nom: 'Chambres', type: TypeChamp.NOMBRE, typeLogements: '*', cleSysteme: 'nbChambres' },
      { nom: 'Cuisine(s)', type: TypeChamp.NOMBRE, typeLogements: '*', cleSysteme: 'nbCuisines' },
      { nom: 'Salon(s)', type: TypeChamp.NOMBRE, typeLogements: '*', cleSysteme: 'nbSalons' },
      { nom: 'Douche(s) / Salle(s) de bain', type: TypeChamp.NOMBRE, typeLogements: '*', cleSysteme: 'nbSdb' },
      { nom: 'WC', type: TypeChamp.NOMBRE, typeLogements: '*', cleSysteme: 'nbWc' },
      { nom: 'Meublé', type: TypeChamp.BOOLEEN, typeLogements: '*', cleSysteme: 'meuble' },
      { nom: 'Parking', type: TypeChamp.BOOLEEN, typeLogements: '*', cleSysteme: 'parking' },
      { nom: 'Ascenseur', type: TypeChamp.BOOLEEN, typeLogements: '*', cleSysteme: 'ascenseur' },
      { nom: 'Fumeurs acceptés', type: TypeChamp.BOOLEEN, typeLogements: '*', cleSysteme: 'fumeurs' },
      { nom: 'Animaux acceptés', type: TypeChamp.BOOLEEN, typeLogements: '*', cleSysteme: 'animaux' },
    ],
  },
  {
    nom: 'Caractéristiques générales',
    ordre: 1,
    champs: [
      { nom: 'Année de construction', type: TypeChamp.NOMBRE, typeLogements: ['appartement', 'villa', 'maison', 'immeuble'] },
      { nom: 'Orientation', type: TypeChamp.SELECT, options: ['Nord', 'Sud', 'Est', 'Ouest'], typeLogements: ['appartement', 'villa', 'maison'] },
      { nom: 'État général', type: TypeChamp.SELECT, options: ['Neuf', 'Bon état', 'À rénover'], typeLogements: ['appartement', 'villa', 'maison', 'studio', 'chambre'] },
    ],
  },
  {
    nom: 'Sécurité',
    ordre: 2,
    champs: [
      { nom: 'Gardiennage', type: TypeChamp.BOOLEEN, typeLogements: ['villa', 'maison', 'immeuble', 'bureau'] },
      { nom: 'Vidéosurveillance', type: TypeChamp.BOOLEEN, typeLogements: ['villa', 'maison', 'immeuble', 'commerce', 'bureau'] },
      { nom: "Hauteur du mur de clôture", type: TypeChamp.SURFACE, unite: 'm', typeLogements: ['villa', 'maison'] },
    ],
  },
  {
    nom: 'Espace événementiel',
    ordre: 3,
    champs: [
      { nom: 'Capacité', type: TypeChamp.NOMBRE, unite: 'personnes', typeLogements: ['espace-evenementiel'], obligatoire: true },
      {
        nom: "Type d'événements adaptés",
        type: TypeChamp.SELECT,
        options: ['Mariage', 'Séminaire / Conférence', 'Anniversaire', 'Concert / Spectacle', 'Autre'],
        typeLogements: ['espace-evenementiel'],
      },
      { nom: 'Sonorisation incluse', type: TypeChamp.BOOLEEN, typeLogements: ['espace-evenementiel'] },
      { nom: 'Traiteur / cuisine équipée', type: TypeChamp.BOOLEEN, typeLogements: ['espace-evenementiel'] },
      { nom: 'Climatisation', type: TypeChamp.BOOLEEN, typeLogements: ['espace-evenementiel'] },
    ],
  },
];

export class ChampSeeder implements Seeder {
  readonly name = 'ChampSeeder';

  async run(prisma: PrismaClient): Promise<void> {
    for (const cat of CATEGORIES) {
      const categorie = await prisma.categorieChamp.upsert({
        where: { nom: cat.nom },
        update: { ordre: cat.ordre },
        create: { nom: cat.nom, ordre: cat.ordre },
      });

      for (const champData of cat.champs) {
        const champ = await prisma.champ.upsert({
          where: { nom_categorieId: { nom: champData.nom, categorieId: categorie.id } },
          update: { type: champData.type, unite: champData.unite, options: champData.options ?? [], cleSysteme: champData.cleSysteme ?? null },
          create: {
            nom: champData.nom,
            type: champData.type,
            unite: champData.unite,
            options: champData.options ?? [],
            categorieId: categorie.id,
            cleSysteme: champData.cleSysteme ?? null,
          },
        });

        const slugs = champData.typeLogements === '*'
          ? (await prisma.typeLogement.findMany({ select: { slug: true } })).map((t) => t.slug)
          : champData.typeLogements;

        for (const slug of slugs) {
          const typeLogement = await prisma.typeLogement.findUnique({ where: { slug } });
          if (!typeLogement) continue;

          await prisma.typeLogementChamp.upsert({
            where: { typeLogementId_champId: { typeLogementId: typeLogement.id, champId: champ.id } },
            update: {},
            create: {
              typeLogementId: typeLogement.id,
              champId: champ.id,
              obligatoire: champData.obligatoire ?? false,
            },
          });
        }

        console.log(`  ✔ Champ : ${champData.nom} (${cat.nom})`);
      }
    }
  }
}
