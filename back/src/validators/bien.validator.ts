import { z } from "zod";

// ─── Schema pour enregistrer un brouillon (validation souple) ─────────────────

export const saveDraftSchema = z.object({
  // ID optionnel pour la mise à jour d'un bien existant
  id: z.uuid().optional(),
  
  titre: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  typeLogementId: z.uuid().optional().nullable(),
  typeTransactionId: z.uuid().optional().nullable(),
  statutBienId: z.uuid().optional().nullable(),

  pays: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  quartier: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  pointRepere: z.string().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  surface: z.coerce.number().min(1).optional().nullable(),
  nbChambres: z.coerce.number().int().min(0).optional().nullable(),
  nbSdb: z.coerce.number().int().min(0).optional().nullable(),
  nbSalons: z.coerce.number().int().min(0).optional().nullable(),
  nbCuisines: z.coerce.number().int().min(0).optional().nullable(),
  nbWc: z.coerce.number().int().min(0).optional().nullable(),
  etage: z.coerce.number().int().min(0).optional().nullable(),
  nbEtages: z.coerce.number().int().min(1).optional().nullable(),

  meuble: z.coerce.boolean().default(false),
  fumeurs: z.coerce.boolean().default(false),
  animaux: z.coerce.boolean().default(false),
  parking: z.coerce.boolean().default(false),
  ascenseur: z.coerce.boolean().default(false),

  prix: z.coerce.number().min(0).optional().nullable(),
  frequencePaiement: z.enum(["journalier", "hebdomadaire", "mensuel", "trimestriel", "semestriel", "annuel", "unique"]).optional().nullable(),
  chargesIncluses: z.coerce.boolean().default(false),
  caution: z.coerce.number().int().min(0).optional().nullable(),
  disponibleLe: z.string().optional().nullable(),

  equipementIds: z.array(z.string().uuid()).default([]),
  meubles: z.array(
    z.object({
      meubleId: z.string().uuid(),
      quantite: z.coerce.number().int().min(1).default(1),
    })
  ).default([]),

  // URLs des photos déjà uploadées à conserver
  existingPhotos: z.array(z.string()).default([]),
  // URL de la vidéo déjà uploadée à conserver
  existingVideoUrl: z.string().optional().nullable(),

  // Champs dynamiques
  champsValeurs: z.array(
    z.object({
      champId: z.string().uuid(),
      valeur:  z.string(),
    })
  ).default([]),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

// ─── Schema pour validation stricte (soumettre pour publication) ──────────────

export const createBienSchema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().max(5000).optional(),
  typeLogementId: z.string().uuid("Type de logement invalide"),
  typeTransactionId: z.string().uuid("Type de transaction invalide"),
  statutBienId: z.string().uuid("Statut de bien invalide"),

  pays: z.string().optional(),
  region: z.string().min(1, "La région est requise"),
  ville: z.string().optional(),
  quartier: z.string().optional(),
  adresse: z.string().optional(),
  pointRepere: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  surface: z.coerce.number().min(1).optional().nullable(),
  nbChambres: z.coerce.number().int().min(0).optional().nullable(),
  nbSdb: z.coerce.number().int().min(0).optional().nullable(),
  nbSalons: z.coerce.number().int().min(0).optional().nullable(),
  nbCuisines: z.coerce.number().int().min(0).optional().nullable(),
  nbWc: z.coerce.number().int().min(0).optional().nullable(),
  etage: z.coerce.number().int().min(0).optional().nullable(),
  nbEtages: z.coerce.number().int().min(1).optional().nullable(),

  meuble: z.coerce.boolean().default(false),
  fumeurs: z.coerce.boolean().default(false),
  animaux: z.coerce.boolean().default(false),
  parking: z.coerce.boolean().default(false),
  ascenseur: z.coerce.boolean().default(false),

  prix: z.coerce.number().min(0, "Le prix doit être positif"),
  frequencePaiement: z.enum(["journalier", "hebdomadaire", "mensuel", "trimestriel", "semestriel", "annuel", "unique"]).optional().nullable(),
  chargesIncluses: z.coerce.boolean().default(false),
  caution: z.coerce.number().int().min(0).optional().nullable(),
  disponibleLe: z.string().optional().nullable(),

  equipementIds: z.array(z.string().uuid()).default([]),
  meubles: z.array(
    z.object({
      meubleId: z.string().uuid(),
      quantite: z.coerce.number().int().min(1).default(1),
    })
  ).default([]),

  existingPhotos: z.array(z.string()).default([]),
  existingVideoUrl: z.string().optional().nullable(),
});

export type CreateBienInput = z.infer<typeof createBienSchema>;

// ─── Schema pour valider une annonce (admin) ──────────────────────────────────

export const validerAnnonceSchema = z.object({
  action: z.enum(["APPROUVER", "REJETER"]),
  note: z.string().max(1000).optional(),
});

export type ValiderAnnonceInput = z.infer<typeof validerAnnonceSchema>;

// ─── Schema pour la file de modération (admin, query string) ──────────────────

export const listAnnoncesAdminQuerySchema = z.object({
  statut: z.enum(["BROUILLON", "EN_ATTENTE", "PUBLIE", "REJETE", "ANNULE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /** Titre, référence (SK-XXXXXXXX), prénom, nom ou téléphone du propriétaire. */
  search: z.string().trim().max(100).optional(),
  ville: z.string().trim().max(100).optional(),
  typeLogementId: z.uuid("Type de logement invalide").optional(),
  /** "true" : seulement les annonces qui ont au moins un signalement en attente. */
  signalees: z.enum(["true", "false"]).transform((valeur) => valeur === "true").optional(),
});

export type ListAnnoncesAdminQuery = z.infer<typeof listAnnoncesAdminQuerySchema>;
