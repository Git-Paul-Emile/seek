import { prisma } from "../config/database.js";

/**
 * Un champ est envoyé par le client mais son autorisation (visible pour le type de
 * bien sélectionné) ne doit JAMAIS dépendre uniquement du frontend — le frontend ne
 * fait que refléter la configuration admin, un client malveillant ou bugué pourrait
 * envoyer n'importe quoi. Cette fonction est le point de passage obligé avant toute
 * écriture en base (brouillon ou mise à jour) : elle recharge la config autorisée
 * pour le typeLogementId soumis et filtre/neutralise ce qui ne l'est pas.
 *
 * Le contrôle "obligatoire" (bloquant) est volontairement laissé à
 * `soumettreAnnonce` — un brouillon doit pouvoir rester incomplet ; seule la
 * soumission finale pour publication exige que les champs requis soient remplis.
 */

/** Clés cleSysteme actuellement gérées et leur valeur "non applicable" */
const SYSTEM_FIELD_DEFAULTS: Record<string, string | number | boolean | null> = {
  surface: null,
  etage: null,
  nbChambres: null,
  nbCuisines: null,
  nbSalons: null,
  nbSdb: null,
  nbWc: null,
  meuble: false,
  parking: false,
  ascenseur: false,
  fumeurs: false,
  animaux: false,
};

export interface RawBienChampsInput {
  typeLogementId?: string | null;
  surface?: number | null;
  etage?: number | null;
  nbChambres?: number | null;
  nbCuisines?: number | null;
  nbSalons?: number | null;
  nbSdb?: number | null;
  nbWc?: number | null;
  meuble?: boolean;
  parking?: boolean;
  ascenseur?: boolean;
  fumeurs?: boolean;
  animaux?: boolean;
  equipementIds?: string[];
  meubles?: { meubleId: string; quantite: number }[];
  champsValeurs?: { champId: string; valeur: string }[];
}

export type SanitizedBienChamps = Pick<
  RawBienChampsInput,
  | "surface" | "etage" | "nbChambres" | "nbCuisines" | "nbSalons" | "nbSdb" | "nbWc"
  | "meuble" | "parking" | "ascenseur" | "fumeurs" | "animaux"
  | "equipementIds" | "meubles" | "champsValeurs"
>;

export async function sanitizeBienChamps(input: RawBienChampsInput): Promise<SanitizedBienChamps> {
  const { typeLogementId } = input;

  // Sans type de bien connu, on ne peut valider aucune association : on ne
  // touche pas aux champs "système" (généralement absents à ce stade du
  // brouillon) mais on ne fait confiance à aucune liste envoyée par le client.
  if (!typeLogementId) {
    return {
      equipementIds: [],
      meubles: [],
      champsValeurs: [],
    };
  }

  const [typeLogementChamps, typeLogementEquipements, typeLogementMeubles] = await Promise.all([
    prisma.typeLogementChamp.findMany({
      where: { typeLogementId },
      include: { champ: { select: { id: true, nom: true, cleSysteme: true } } },
    }),
    prisma.typeLogementEquipement.findMany({ where: { typeLogementId }, select: { equipementId: true } }),
    prisma.typeLogementMeuble.findMany({ where: { typeLogementId }, select: { meubleId: true } }),
  ]);

  const authorizedEquipementIds = new Set(typeLogementEquipements.map((e) => e.equipementId));
  const authorizedMeubleIds = new Set(typeLogementMeubles.map((m) => m.meubleId));

  const systemAssociations = new Map<string, { obligatoire: boolean }>();
  const dynamicAssociations = new Map<string, { obligatoire: boolean; nom: string }>();
  for (const tlc of typeLogementChamps) {
    if (tlc.champ.cleSysteme) {
      systemAssociations.set(tlc.champ.cleSysteme, { obligatoire: tlc.obligatoire });
    } else {
      dynamicAssociations.set(tlc.champId, { obligatoire: tlc.obligatoire, nom: tlc.champ.nom });
    }
  }

  // ── Champs système (colonnes statiques de Bien) ──
  // Non autorisé pour ce type de bien => valeur neutre forcée, quoi qu'ait
  // envoyé le client. Autorisé => valeur du client conservée telle quelle
  // (le contrôle "obligatoire" est fait par soumettreAnnonce, pas ici).
  const sanitized: SanitizedBienChamps = {};
  for (const key of Object.keys(SYSTEM_FIELD_DEFAULTS)) {
    const assoc = systemAssociations.get(key);
    const rawValue = (input as Record<string, unknown>)[key];
    (sanitized as Record<string, unknown>)[key] = !assoc || rawValue === undefined
      ? SYSTEM_FIELD_DEFAULTS[key]
      : rawValue;
  }

  // ── Champs dynamiques (BienChampValeur) : ne garder que les champId autorisés ──
  sanitized.champsValeurs = (input.champsValeurs ?? []).filter((cv) => dynamicAssociations.has(cv.champId));

  // ── Équipements / Meubles : ne garder que les IDs autorisés ──
  sanitized.equipementIds = (input.equipementIds ?? []).filter((id) => authorizedEquipementIds.has(id));
  sanitized.meubles = (input.meubles ?? []).filter((m) => authorizedMeubleIds.has(m.meubleId));

  return sanitized;
}
