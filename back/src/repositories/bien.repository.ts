import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { StatutAnnonce } from "../generated/prisma/enums.js";
import {
  dernieresAnnoncesCache,
  rechercheCache,
  lieuxCache,
  invalidateAnnoncesCache,
} from "../services/cache.service.js";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BienData {
  titre?: string | null;
  description?: string | null;
  typeLogementId?: string | null;
  typeTransactionId?: string | null;
  statutBienId?: string | null;
  proprietaireId: string;
  pays?: string | null;
  region?: string | null;
  ville?: string | null;
  quartier?: string | null;
  adresse?: string | null;
  pointRepere?: string | null;
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  surface?: number | null;
  nbChambres?: number | null;
  nbSdb?: number | null;
  nbSalons?: number | null;
  nbCuisines?: number | null;
  nbWc?: number | null;
  etage?: number | null;
  nbEtages?: number | null;
  meuble?: boolean;
  fumeurs?: boolean;
  animaux?: boolean;
  parking?: boolean;
  ascenseur?: boolean;
  prix?: number | null;
  prixAncien?: number | null;
  dateDerniereModificationPrix?: Date | null;
  frequencePaiement?: string | null;
  chargesIncluses?: boolean;
  caution?: number | null;
  disponibleLe?: Date | null;
  photos?: string[];
  statutAnnonce?: StatutAnnonce;
  equipementIds?: string[];
  meubles?: { meubleId: string; quantite: number }[];
  champsValeurs?: { champId: string; valeur: string }[];
}

// Keep backward compat alias
export type CreateBienData = BienData;

export interface EtablissementData {
  bienId: string;
  type: string;
  nom?: string | null;
  latitude: number;
  longitude: number;
  distance?: number | null;
}

// ─── Include helper ───────────────────────────────────────────────────────────

const BIEN_INCLUDE = {
  typeLogement: { select: { id: true, nom: true, slug: true } },
  typeTransaction: { select: { id: true, nom: true, slug: true } },
  statutBien: { select: { id: true, nom: true, slug: true } },
  equipements: {
    include: { equipement: { select: { id: true, nom: true } } },
  },
  meubles: {
    include: { meuble: { select: { id: true, nom: true } } },
  },
  champsValeurs: {
    include: { champ: { select: { id: true, nom: true, type: true, unite: true } } },
  },
  proprietaire: {
    select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true },
  },
  etablissements: { select: { id: true } },
} as const;

// ─── Fonctions CRUD ───────────────────────────────────────────────────────────

export const createBien = async (data: BienData) => {
  const { equipementIds = [], meubles = [], champsValeurs = [], ...bienData } = data;

  const bien = await prisma.bien.create({
    data: {
      ...bienData,
      equipements: equipementIds.length > 0
        ? { createMany: { data: equipementIds.map((equipementId) => ({ equipementId })), skipDuplicates: true } }
        : undefined,
      meubles: meubles.length > 0
        ? { createMany: { data: meubles, skipDuplicates: true } }
        : undefined,
      champsValeurs: champsValeurs.length > 0
        ? { createMany: { data: champsValeurs, skipDuplicates: true } }
        : undefined,
    },
    include: BIEN_INCLUDE,
  });
  invalidateAnnoncesCache();
  return bien;
};

export const updateBien = async (id: string, data: Partial<BienData>) => {
  const { equipementIds, meubles, champsValeurs, proprietaireId: _pid, ...bienData } = data;

  // Delete and recreate relations if provided
  if (equipementIds !== undefined || meubles !== undefined || champsValeurs !== undefined) {
    await prisma.$transaction([
      ...(equipementIds !== undefined
        ? [prisma.bienEquipement.deleteMany({ where: { bienId: id } })]
        : []),
      ...(meubles !== undefined
        ? [prisma.bienMeuble.deleteMany({ where: { bienId: id } })]
        : []),
      ...(champsValeurs !== undefined
        ? [prisma.bienChampValeur.deleteMany({ where: { bienId: id } })]
        : []),
    ]);
  }

  const bien = await prisma.bien.update({
    where: { id },
    data: {
      ...bienData,
      ...(equipementIds !== undefined && equipementIds.length > 0
        ? { equipements: { createMany: { data: equipementIds.map((equipementId) => ({ equipementId })), skipDuplicates: true } } }
        : {}),
      ...(meubles !== undefined && meubles.length > 0
        ? { meubles: { createMany: { data: meubles, skipDuplicates: true } } }
        : {}),
      ...(champsValeurs !== undefined && champsValeurs.length > 0
        ? { champsValeurs: { createMany: { data: champsValeurs, skipDuplicates: true } } }
        : {}),
    },
    include: BIEN_INCLUDE,
  });
  invalidateAnnoncesCache();
  return bien;
};

export const deleteBienById = async (id: string) => {
  const bien = await prisma.bien.delete({ where: { id } });
  invalidateAnnoncesCache();
  return bien;
};


export const getDraftByProprietaire = async (proprietaireId: string) => {
  return prisma.bien.findFirst({
    where: { proprietaireId, statutAnnonce: "BROUILLON" },
    include: BIEN_INCLUDE,
  });
};

export const updateStatutAnnonce = async (
  id: string,
  statutAnnonce: StatutAnnonce,
  noteAdmin?: string
) => {
  const bien = await prisma.bien.update({
    where: { id },
    data: {
      statutAnnonce,
      ...(noteAdmin !== undefined ? { noteAdmin } : {}),
      ...(statutAnnonce === "PUBLIE" ? { publishedAt: new Date() } : {}),
    },
    include: BIEN_INCLUDE,
  });
  invalidateAnnoncesCache();
  return bien;
};

export const createEtablissements = async (items: EtablissementData[]) => {
  if (items.length === 0) return;
  return prisma.etablissement.createMany({ data: items });
};

export const getBiensByProprietaire = async (proprietaireId: string) => {
  return prisma.bien.findMany({
    where: { proprietaireId },
    orderBy: { createdAt: "desc" },
    include: {
      typeLogement: { select: { id: true, nom: true, slug: true } },
      typeTransaction: { select: { id: true, nom: true, slug: true } },
      statutBien: { select: { id: true, nom: true, slug: true } },
      proprietaire: {
        select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true },
      },
      bails: { where: { statut: "ACTIF" }, select: { id: true } },
    },
  });
};

export const getBienById = async (id: string) => {
  return prisma.bien.findUnique({
    where: { id },
    include: {
      typeLogement: true,
      typeTransaction: true,
      statutBien: true,
      equipements: {
        include: { equipement: { include: { categorie: true } } },
      },
      meubles: {
        include: { meuble: { include: { categorie: true } } },
      },
      etablissements: true,
      champsValeurs: { select: { champId: true, valeur: true } },
      proprietaire: {
        select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true },
      },
    },
  });
};

// ─── Admin - annonces ─────────────────────────────────────────────────────────

export const countAnnoncesPending = async () => {
  return prisma.bien.count({
    where: { statutAnnonce: "EN_ATTENTE" },
  });
};

// Signalement pas encore traité par l'admin : l'annonce est « signalée ».
const SIGNALEMENT_EN_ATTENTE: Prisma.SignalementListRelationFilter = { some: { statut: "EN_ATTENTE" } };

export const getAnnoncesCounts = async () => {
  const [en_attente, publie, rejete, annule, signalees] = await prisma.$transaction([
    prisma.bien.count({ where: { statutAnnonce: "EN_ATTENTE" } }),
    prisma.bien.count({ where: { statutAnnonce: "PUBLIE" } }),
    prisma.bien.count({ where: { statutAnnonce: "REJETE" } }),
    prisma.bien.count({ where: { statutAnnonce: "ANNULE" as any } }),
    prisma.bien.count({
      where: { statutAnnonce: { notIn: ["ANNULE", "BROUILLON"] }, signalements: SIGNALEMENT_EN_ATTENTE },
    }),
  ]);
  return { EN_ATTENTE: en_attente, PUBLIE: publie, REJETE: rejete, ANNULE: annule, SIGNALEES: signalees };
};

export const getAnnonces = async (params: {
  statut?: StatutAnnonce;
  page?: number;
  limit?: number;
  /** Chaque mot doit apparaître dans au moins un des champs cherchés. */
  mots?: { texte: string; prefixeId?: string }[];
  ville?: string;
  typeLogementId?: string;
  signalees?: boolean;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  // Sans statut demandé, les brouillons et les annonces annulées restent hors de la file.
  const where: Prisma.BienWhereInput = {
    statutAnnonce: params.statut ?? { notIn: ["ANNULE", "BROUILLON"] },
  };

  if (params.ville) where.ville = { equals: params.ville, mode: "insensitive" };
  if (params.typeLogementId) where.typeLogementId = params.typeLogementId;
  if (params.signalees) where.signalements = SIGNALEMENT_EN_ATTENTE;

  if (params.mots?.length) {
    where.AND = params.mots.map(({ texte, prefixeId }) => ({
      OR: [
        { titre: { contains: texte, mode: "insensitive" } },
        { proprietaire: { prenom: { contains: texte, mode: "insensitive" } } },
        { proprietaire: { nom: { contains: texte, mode: "insensitive" } } },
        { proprietaire: { telephone: { contains: texte } } },
        ...(prefixeId ? [{ id: { startsWith: prefixeId } }] : []),
      ],
    }));
  }

  const [items, total] = await prisma.$transaction([
    prisma.bien.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        typeLogement: { select: { id: true, nom: true, slug: true } },
        typeTransaction: { select: { id: true, nom: true, slug: true } },
        statutBien: { select: { id: true, nom: true, slug: true } },
        proprietaire: {
          select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true },
        },
      },
    }),
    prisma.bien.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Public - dernières annonces (pour page d'accueil) ────────────────────────

export const getDernieresAnnonces = async (limit: number = 10) => {
  const cacheKey = `dernieres_${limit}`;
  
  // Vérifier le cache d'abord
  const cached = dernieresAnnoncesCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const biens = await prisma.bien.findMany({
    where: { 
      statutAnnonce: "PUBLIE",
      actif: true,
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      typeLogement: { select: { id: true, nom: true, slug: true } },
      typeTransaction: { select: { id: true, nom: true, slug: true } },
      statutBien: { select: { id: true, nom: true, slug: true } },
      proprietaire: {
        select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true },
      },
    },
  });

  // Ajouter un flag "isNew" pour les annonces publiées il y a moins de 7 jours
  const result = biens.map((bien) => ({
    ...bien,
    isNew: bien.createdAt >= sevenDaysAgo,
  }));
  
  // Mettre en cache le résultat
  dernieresAnnoncesCache.set(cacheKey, result);
  
  return result;
};

// ─── Public - annonce publiée par ID ─────────────────────────────────────────────

export const getAnnoncePublieById = async (id: string) => {
  const bien = await prisma.bien.findUnique({
    where: {
      id,
    },
    include: {
      typeLogement: true,
      typeTransaction: true,
      statutBien: true,
      equipements: {
        include: { equipement: { include: { categorie: true } } },
      },
      meubles: {
        include: { meuble: { include: { categorie: true } } },
      },
      etablissements: true,
      proprietaire: {
        select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true },
      },
    },
  });

  if (!bien || bien.statutAnnonce !== "PUBLIE" || !bien.actif) return null;

  // Compter les annonces publiées du même propriétaire en parallèle — déjà ici, pas de requête supplémentaire bloquante
  const nombreAnnonces = await prisma.bien.count({
    where: { proprietaireId: bien.proprietaireId, statutAnnonce: "PUBLIE", actif: true },
  });

  return { ...bien, nombreAnnoncesProprietaire: nombreAnnonces };
};

// ─── Public - lieux distincts : quartiers depuis la table Quartier, villes depuis Ville ──

export const getDistinctLieux = async () => {
  // Vérifier le cache d'abord
  const cached = lieuxCache.get('lieux');
  if (cached) {
    return cached;
  }
  
  const [quartierRows, villeRows] = await prisma.$transaction([
    prisma.quartier.findMany({
      select: { nom: true, ville: { select: { nom: true } } },
      orderBy: { nom: "asc" },
    }),
    prisma.ville.findMany({
      select: { nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);
  const result = {
    quartiers: quartierRows.map((r) => ({ nom: r.nom, ville: r.ville.nom })),
    villes:    villeRows.map((r) => r.nom),
  };
  
  // Mettre en cache le résultat
  lieuxCache.set('lieux', result);
  
  return result;
};

// ─── Public - recherche avec filtres combinés ─────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const INCLUDE_PUBLIC = {
  typeLogement:    { select: { id: true, nom: true, slug: true } },
  typeTransaction: { select: { id: true, nom: true, slug: true } },
  statutBien:      { select: { id: true, nom: true, slug: true } },
  proprietaire:    { select: { id: true, prenom: true, nom: true, telephone: true, email: true, statutVerification: true } },
} as const;

export const searchAnnoncePubliques = async (params: {
  ville?: string;
  quartier?: string;
  typeLogementSlug?: string;
  typeTransactionSlug?: string;
  statutBienSlug?: string;
  proprietaireVerification?: string;
  prixMin?: number;
  prixMax?: number;
  nbChambresMin?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  meuble?: boolean;
  parking?: boolean;
  ascenseur?: boolean;
  fumeurs?: boolean;
  animaux?: boolean;
  equipementIds?: string[];
  misEnAvant?: boolean;
  featuredFirst?: boolean;
  sortBy?: "prix" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  // Recherche par proximité
  lat?: number;
  lng?: number;
  radius?: number; // km - défaut 5
}) => {
  const page  = Math.max(params.page  ?? 1,  1);
  const limit = Math.min(params.limit ?? 10, 50);
  const skip  = (page - 1) * limit;

  // Créer une clé de cache basée sur les paramètres
  const cacheKey = `recherche_${JSON.stringify(params)}`;
  
  // Vérifier le cache pour les requêtes sans proximité (les recherches géographiques ne sont pas mises en cache)
  if (params.lat === undefined && params.lng === undefined) {
    const cached = rechercheCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const where: any = { statutAnnonce: "PUBLIE", actif: true };

  // Filtre ville (ignoré si mode proximité actif : le point précis prime sur la ville)
  if (!params.lat && params.ville?.trim()) {
    const v = params.ville.trim();
    where.AND = [
      ...(where.AND ?? []),
      { OR: [
        { ville:  { equals: v, mode: "insensitive" } },
        { region: { equals: v, mode: "insensitive" } },
      ]},
    ];
  }
  // Filtre quartier : appliqué même en mode proximité, pour permettre de restreindre
  // une recherche par point précis à un quartier donné (tri par distance conservé)
  if (params.quartier?.trim()) {
    const q = params.quartier.trim();
    where.AND = [
      ...(where.AND ?? []),
      { OR: [
        { quartier: { equals: q, mode: "insensitive" } },
        { adresse:  { contains: q, mode: "insensitive" } },
      ]},
    ];
  }

  if (params.typeLogementSlug)    where.typeLogement    = { slug: params.typeLogementSlug };
  if (params.typeTransactionSlug) where.typeTransaction = { slug: params.typeTransactionSlug };
  if (params.statutBienSlug)      where.statutBien     = { slug: params.statutBienSlug };
  if (params.proprietaireVerification === "VERIFIED") {
    where.proprietaire = { statutVerification: "VERIFIED" };
  } else if (params.proprietaireVerification === "NON_VERIFIED") {
    where.proprietaire = { statutVerification: { not: "VERIFIED" } };
  }

  if (params.prixMin !== undefined || params.prixMax !== undefined) {
    where.prix = {};
    if (params.prixMin !== undefined) where.prix.gte = params.prixMin;
    if (params.prixMax !== undefined) where.prix.lte = params.prixMax;
  }

  if (params.nbChambresMin !== undefined) where.nbChambres = { gte: params.nbChambresMin };

  if (params.surfaceMin !== undefined || params.surfaceMax !== undefined) {
    where.surface = {};
    if (params.surfaceMin !== undefined) where.surface.gte = params.surfaceMin;
    if (params.surfaceMax !== undefined) where.surface.lte = params.surfaceMax;
  }

  if (params.meuble    === true) where.meuble    = true;
  if (params.parking   === true) where.parking   = true;
  if (params.ascenseur === true) where.ascenseur = true;
  if (params.fumeurs   === true) where.fumeurs   = true;
  if (params.animaux   === true) where.animaux   = true;
  if (params.misEnAvant === true) {
    const now = new Date();
    where.estMisEnAvant = true;
    where.dateFinPromotion = { gte: now };
  }
  if (params.equipementIds && params.equipementIds.length > 0) {
    where.AND = [
      ...(where.AND ?? []),
      { equipements: { some: { equipementId: { in: params.equipementIds } } } },
    ];
  }

  // ── Mode proximité : tri par distance (bounding box + Haversine) ─────────────
  if (params.lat !== undefined && params.lng !== undefined) {
    const lat = params.lat;
    const lng = params.lng;
    const radiusKm = params.radius ?? 5;

    // Pré-filtre par bounding box SQL (~1° latitude ≈ 111 km)
    const delta = radiusKm / 111;
    const bboxBiens = await prisma.bien.findMany({
      where: {
        ...where,
        latitude: { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
      },
      take: 500, // Plafond pour éviter de charger toute la table
      include: INCLUDE_PUBLIC,
    });

    // Calculer la distance exacte, filtrer par rayon et trier
    const withDist = bboxBiens
      .map((b) => ({ ...b, distance: haversineKm(lat, lng, b.latitude!, b.longitude!) }))
      .filter((b) => b.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    const total = withDist.length;
    const items = withDist.slice(skip, skip + limit);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Mode normal : tri par champ ───────────────────────────────────────────────
  const sortField = params.sortBy ?? "createdAt";
  const sortDir   = params.sortOrder ?? "desc";
  const baseOrder = sortField === "prix"
    ? [{ prix: { sort: sortDir, nulls: "last" as const } }]
    : [{ createdAt: sortDir as "asc" | "desc" }];
  // Mis en avant en premier si demandé (true > false dans PostgreSQL ORDER BY DESC)
  const orderBy = params.featuredFirst
    ? [{ estMisEnAvant: "desc" as const }, ...baseOrder]
    : baseOrder;

  const [items, total] = await prisma.$transaction([
    prisma.bien.findMany({ where, skip, take: limit, orderBy, include: INCLUDE_PUBLIC }),
    prisma.bien.count({ where }),
  ]);

  const result = { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  
  // Mettre en cache le résultat (uniquement pour les requêtes sans proximité)
  if (params.lat === undefined && params.lng === undefined) {
    rechercheCache.set(cacheKey, result);
  }
  
  return result;
};

// ─── Public - annonces similaires avec système de score ───────────────────────

// Type pour un bien avec les relations de base
export interface BienWithRelations {
  id: string;
  titre: string | null;
  description: string | null;
  typeLogementId: string | null;
  typeTransactionId: string | null;
  statutBienId: string | null;
  proprietaireId: string;
  pays: string | null;
  region: string | null;
  ville: string | null;
  quartier: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  surface: number | null;
  nbChambres: number | null;
  nbSdb: number | null;
  prix: number | null;
  photos: string[];
  statutAnnonce: string;
  createdAt: Date;
  updatedAt: Date;
  typeLogement: { id: string; nom: string; slug: string } | null;
  typeTransaction: { id: string; nom: string; slug: string } | null;
  statutBien: { id: string; nom: string; slug: string } | null;
}

interface SimilarityScore {
  bien: BienWithRelations;
  score: number;
}

/**
 * Score de similarité - adapté aux marchés immobiliers type Seek
 *
 * Critères (score max ≈ 135) :
 *   +35  même type de transaction (vente / location)  - fondamental
 *   +30  même type de logement                        - très important
 *   +20  même quartier                                - fort signal géographique
 *   +10  même ville (si quartier différent)           - signal géographique modéré
 *   +20  prix ±15 %                                   - très proche
 *   +12  prix ±30 %                                   - proche
 *    +5  prix ±50 %                                   - acceptable
 *   +10  surface ±30 %                                - physiquement comparable
 *   +10  nb chambres identique                        - même configuration
 *    +5  nb chambres ±1                               - configuration proche
 *
 * Seuil de pertinence : >= 65 (au moins même type de transaction + même type de logement)
 */
function calculateSimilarityScore(
  bien: BienWithRelations,
  referenceBien: BienWithRelations
): number {
  if (!bien || !referenceBien) return 0;

  let score = 0;

  // 1. Même type de transaction - FONDAMENTAL
  if (bien.typeTransactionId && referenceBien.typeTransactionId &&
      bien.typeTransactionId === referenceBien.typeTransactionId) {
    score += 35;
  }

  // 2. Même type de logement
  if (bien.typeLogementId && referenceBien.typeLogementId &&
      bien.typeLogementId === referenceBien.typeLogementId) {
    score += 30;
  }

  // 3. Géographie
  const sameVille = bien.ville && referenceBien.ville &&
    bien.ville.toLowerCase().trim() === referenceBien.ville.toLowerCase().trim();
  const sameQuartier = bien.quartier && referenceBien.quartier &&
    bien.quartier.toLowerCase().trim() === referenceBien.quartier.toLowerCase().trim();

  if (sameQuartier) {
    score += 20; // quartier identique - très fort signal
  } else if (sameVille) {
    score += 10; // même ville, quartiers différents
  }

  // 4. Prix similaire
  if (bien.prix && referenceBien.prix && referenceBien.prix > 0) {
    const priceDiff = Math.abs(bien.prix - referenceBien.prix) / referenceBien.prix;
    if (priceDiff <= 0.15) {
      score += 20;
    } else if (priceDiff <= 0.30) {
      score += 12;
    } else if (priceDiff <= 0.50) {
      score += 5;
    }
  }

  // 5. Surface similaire ±30 %
  if (bien.surface && referenceBien.surface && referenceBien.surface > 0) {
    const surfaceDiff = Math.abs(bien.surface - referenceBien.surface) / referenceBien.surface;
    if (surfaceDiff <= 0.30) {
      score += 10;
    }
  }

  // 6. Nombre de chambres
  if (bien.nbChambres != null && referenceBien.nbChambres != null) {
    const chambreDiff = Math.abs(bien.nbChambres - referenceBien.nbChambres);
    if (chambreDiff === 0) {
      score += 10;
    } else if (chambreDiff === 1) {
      score += 5;
    }
  }

  return score;
}

// Score minimum pour qu'une annonce soit considérée pertinente
const MIN_SIMILARITY_SCORE = 65; // au moins même type de transaction + même type de logement

export const getAnnoncesSimilairesWithScore = async (
  bienId: string,
  limit: number = 4
): Promise<BienWithRelations[]> => {
  // Récupérer le bien de référence avec tous les champs nécessaires au score
  const referenceBien = await prisma.bien.findUnique({
    where: { id: bienId },
    select: {
      id: true,
      typeLogementId: true,
      typeTransactionId: true,
      ville: true,
      quartier: true,
      prix: true,
      surface: true,
      nbChambres: true,
    },
  });

  if (!referenceBien) {
    return [];
  }

  const excludedIds = [bienId];
  const POOL_FACTOR = 4; // candidats à évaluer par slot demandé

  // ── Niveau 1 : même ville + même transaction + même type de logement ──────
  let candidates = await prisma.bien.findMany({
    where: {
      statutAnnonce: "PUBLIE",
      actif: true,
      id: { notIn: excludedIds },
      ville: referenceBien.ville,
      typeTransactionId: referenceBien.typeTransactionId,
      typeLogementId: referenceBien.typeLogementId,
    },
    include: {
      typeLogement: { select: { id: true, nom: true, slug: true } },
      typeTransaction: { select: { id: true, nom: true, slug: true } },
      statutBien: { select: { id: true, nom: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit * POOL_FACTOR,
  });

  const foundIds = [...excludedIds, ...candidates.map(b => b.id)];

  // ── Niveau 2 : même ville + même transaction (type logement libre) ─────────
  if (candidates.length < limit * POOL_FACTOR) {
    const extras = await prisma.bien.findMany({
      where: {
        statutAnnonce: "PUBLIE",
        actif: true,
        id: { notIn: foundIds },
        ville: referenceBien.ville,
        typeTransactionId: referenceBien.typeTransactionId,
        typeLogementId: referenceBien.typeLogementId,
      },
      include: {
        typeLogement: { select: { id: true, nom: true, slug: true } },
        typeTransaction: { select: { id: true, nom: true, slug: true } },
        statutBien: { select: { id: true, nom: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit * POOL_FACTOR,
    });
    candidates = [...candidates, ...extras];
    foundIds.push(...extras.map(b => b.id));
  }

  // ── Niveau 3 : même transaction + même type logement (autre ville) ────────
  if (candidates.length < limit * POOL_FACTOR) {
    const extras = await prisma.bien.findMany({
      where: {
        statutAnnonce: "PUBLIE",
        actif: true,
        id: { notIn: foundIds },
        typeTransactionId: referenceBien.typeTransactionId,
        typeLogementId: referenceBien.typeLogementId,
        ...(referenceBien.ville ? { NOT: { ville: referenceBien.ville } } : {}),
      },
      include: {
        typeLogement: { select: { id: true, nom: true, slug: true } },
        typeTransaction: { select: { id: true, nom: true, slug: true } },
        statutBien: { select: { id: true, nom: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit * POOL_FACTOR,
    });
    candidates = [...candidates, ...extras];
  }

  // ── Scoring + tri ─────────────────────────────────────────────────────────
  const scored: SimilarityScore[] = candidates.map(b => ({
    bien: b as BienWithRelations,
    score: calculateSimilarityScore(b as BienWithRelations, referenceBien as BienWithRelations),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter(
      (s) =>
        s.bien.typeLogementId === referenceBien.typeLogementId &&
        s.score >= MIN_SIMILARITY_SCORE
    )
    .slice(0, limit)
    .map(s => s.bien);
};

// Ancienne méthode conservée pour compatibilité (délègue vers la nouvelle)
export const getAnnoncesSimilaires = async (
  bienId: string,
  _typeLogementId: string | null,
  _typeTransactionId: string | null,
  _ville: string | null,
  limit: number = 4
) => {
  return getAnnoncesSimilairesWithScore(bienId, limit);
};

// ─── Stats Propriétaire ───────────────────────────────────────────────────────

export interface OwnerStats {
  totalBiens: number;
  byStatut: { statut: string; count: number }[];
  recentBiens: {
    id: string;
    titre: string | null;
    statutAnnonce: string;
    ville: string | null;
    prix: number | null;
    photos: string[];
    updatedAt: Date;
  }[];
  nbLocatairesActifs: number;
  nbBailsActifs: number;
  montantMensuelLoyers: number;
  nbEcheancesEnRetard: number;
}

export const getOwnerStats = async (proprietaireId: string): Promise<OwnerStats> => {
  const [totalBiens, groupedStatuts, recentBiens, nbLocatairesActifs, bailsActifs, nbEcheancesEnRetard] = await Promise.all([
    prisma.bien.count({ where: { proprietaireId } }),
    prisma.bien.groupBy({
      by: ["statutAnnonce"],
      where: { proprietaireId },
      _count: true,
    }),
    prisma.bien.findMany({
      where: { proprietaireId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        titre: true,
        statutAnnonce: true,
        ville: true,
        prix: true,
        photos: true,
        updatedAt: true,
      },
    }),
    prisma.locataire.count({ where: { proprietaireId, statut: "ACTIF" } }),
    prisma.bailLocation.findMany({
      where: { proprietaireId, statut: "ACTIF" },
      select: { montantLoyer: true },
    }),
    prisma.echeancierLoyer.count({
      where: {
        bail: { proprietaireId },
        statut: "EN_RETARD",
      },
    }),
  ]);

  const statutMap = new Map(groupedStatuts.map(g => [g.statutAnnonce, g._count]));
  const statuts = ["BROUILLON", "EN_ATTENTE", "PUBLIE", "REJETE", "ANNULE"] as const;
  const countsByStatut = statuts.map(s => ({ statut: s, count: statutMap.get(s) ?? 0 }));
  const montantMensuelLoyers = bailsActifs.reduce((sum, b) => sum + b.montantLoyer, 0);

  return {
    totalBiens,
    byStatut: countsByStatut,
    recentBiens,
    nbLocatairesActifs,
    nbBailsActifs: bailsActifs.length,
    montantMensuelLoyers,
    nbEcheancesEnRetard,
  };
};

// ─── Stats vues d'un bien (propriétaire) ─────────────────────────────────────

export interface StatsVuesBien {
  vuesTotales: number;
  vuesAujourdhui: number;
  vuesCetteSemaine: number;
  evolution: { date: string; count: number }[]; // 7 derniers jours
}

export const getStatsVuesBien = async (bienId: string, proprietaireId: string): Promise<StatsVuesBien> => {
  // Vérifier que le bien appartient au propriétaire
  const bien = await prisma.bien.findFirst({ where: { id: bienId, proprietaireId }, select: { nbVues: true } });
  if (!bien) throw new Error("Bien introuvable");

  const now = new Date();
  const debutJour = new Date(now); debutJour.setHours(0, 0, 0, 0);
  const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - 6); debutSemaine.setHours(0, 0, 0, 0);

  const [vuesAujourdhui, vuesCetteSemaine, vuesParJour] = await Promise.all([
    prisma.vueBien.count({ where: { bienId, createdAt: { gte: debutJour } } }),
    prisma.vueBien.count({ where: { bienId, createdAt: { gte: debutSemaine } } }),
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "VueBien"
      WHERE "bienId" = ${bienId}
        AND "createdAt" >= ${debutSemaine}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  // Construire l'évolution sur 7 jours (remplir les jours sans vues avec 0)
  const evolution: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = vuesParJour.find(r => r.date.toISOString().slice(0, 10) === key);
    evolution.push({ date: key, count: found ? Number(found.count) : 0 });
  }

  return {
    vuesTotales: bien.nbVues,
    vuesAujourdhui,
    vuesCetteSemaine,
    evolution,
  };
};

// ─── Stats vues globales owner (toutes ses annonces) ─────────────────────────

export interface StatsVuesOwner {
  vuesTotales: number;
  vuesAujourdhui: number;
  vuesCetteSemaine: number;
  topAnnonces: { id: string; titre: string | null; ville: string | null; nbVues: number; vuesAujourdhui: number; vuesCetteSemaine: number }[];
}

export const getStatsVuesOwner = async (proprietaireId: string): Promise<StatsVuesOwner> => {
  const now = new Date();
  const debutJour = new Date(now); debutJour.setHours(0, 0, 0, 0);
  const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - 6); debutSemaine.setHours(0, 0, 0, 0);

  const biens = await prisma.bien.findMany({
    where: { proprietaireId, statutAnnonce: "PUBLIE" },
    select: { id: true, titre: true, ville: true, nbVues: true },
  });

  const bienIds = biens.map(b => b.id);
  if (bienIds.length === 0) {
    return { vuesTotales: 0, vuesAujourdhui: 0, vuesCetteSemaine: 0, topAnnonces: [] };
  }

  const [vuesAujourdhui, vuesCetteSemaine, vuesParBienAujourdhui, vuesParBienSemaine] = await Promise.all([
    prisma.vueBien.count({ where: { bienId: { in: bienIds }, createdAt: { gte: debutJour } } }),
    prisma.vueBien.count({ where: { bienId: { in: bienIds }, createdAt: { gte: debutSemaine } } }),
    prisma.vueBien.groupBy({ by: ["bienId"], where: { bienId: { in: bienIds }, createdAt: { gte: debutJour } }, _count: { id: true } }),
    prisma.vueBien.groupBy({ by: ["bienId"], where: { bienId: { in: bienIds }, createdAt: { gte: debutSemaine } }, _count: { id: true } }),
  ]);

  const topAnnonces = biens
    .map(b => ({
      id: b.id,
      titre: b.titre,
      ville: b.ville,
      nbVues: b.nbVues,
      vuesAujourdhui: vuesParBienAujourdhui.find(r => r.bienId === b.id)?._count.id ?? 0,
      vuesCetteSemaine: vuesParBienSemaine.find(r => r.bienId === b.id)?._count.id ?? 0,
    }))
    .sort((a, b) => b.nbVues - a.nbVues)
    .slice(0, 10);

  return {
    vuesTotales: biens.reduce((s, b) => s + b.nbVues, 0),
    vuesAujourdhui,
    vuesCetteSemaine,
    topAnnonces,
  };
};

// ─── Stats vues admin (globales plateforme) ───────────────────────────────────

export interface AdminStatsVues {
  totalVuesPlateforme: number;
  vuesAujourdhui: number;
  vuesCetteSemaine: number;
  topAnnonces: { id: string; titre: string | null; ville: string | null; nbVues: number }[];
  vuesParVille: { ville: string; count: number }[];
  vuesParTypeLogement: { typeLogement: string; count: number }[];
}

export const getAdminStatsVues = async (): Promise<AdminStatsVues> => {
  const now = new Date();
  const debutJour = new Date(now); debutJour.setHours(0, 0, 0, 0);
  const debutSemaine = new Date(now); debutSemaine.setDate(now.getDate() - 6); debutSemaine.setHours(0, 0, 0, 0);

  const [totalVuesPlateforme, vuesAujourdhui, vuesCetteSemaine, topAnnonces, vuesParVilleRaw, vuesParTypeRaw] = await Promise.all([
    prisma.bien.aggregate({ _sum: { nbVues: true } }).then(r => r._sum.nbVues ?? 0),
    prisma.vueBien.count({ where: { createdAt: { gte: debutJour } } }),
    prisma.vueBien.count({ where: { createdAt: { gte: debutSemaine } } }),
    prisma.bien.findMany({
      where: { statutAnnonce: "PUBLIE", actif: true },
      orderBy: { nbVues: "desc" },
      take: 10,
      select: { id: true, titre: true, ville: true, nbVues: true },
    }),
    prisma.$queryRaw<{ ville: string; count: bigint }[]>`
      SELECT b.ville, COUNT(v.id) as count
      FROM "VueBien" v
      JOIN "Bien" b ON b.id = v."bienId"
      WHERE b.ville IS NOT NULL
      GROUP BY b.ville
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw<{ typeLogement: string; count: bigint }[]>`
      SELECT tl.nom as "typeLogement", COUNT(v.id) as count
      FROM "VueBien" v
      JOIN "Bien" b ON b.id = v."bienId"
      JOIN "TypeLogement" tl ON tl.id = b."typeLogementId"
      GROUP BY tl.nom
      ORDER BY count DESC
    `,
  ]);

  return {
    totalVuesPlateforme,
    vuesAujourdhui,
    vuesCetteSemaine,
    topAnnonces,
    vuesParVille: vuesParVilleRaw.map(r => ({ ville: r.ville, count: Number(r.count) })),
    vuesParTypeLogement: vuesParTypeRaw.map(r => ({ typeLogement: r.typeLogement, count: Number(r.count) })),
  };
};

// ─── Stats favoris pour le propriétaire ────────────────────────────────────────

export interface StatsFavorisOwner {
  favorisTotaux: number;
  topAnnonces: { id: string; titre: string | null; ville: string | null; nbFavoris: number }[];
}

export const getStatsFavorisOwner = async (proprietaireId: string): Promise<StatsFavorisOwner> => {
  const biens = await prisma.bien.findMany({
    where: { proprietaireId, statutAnnonce: "PUBLIE" },
    select: { id: true, titre: true, ville: true, nbFavoris: true },
  });

  const topAnnonces = biens
    .sort((a, b) => b.nbFavoris - a.nbFavoris)
    .slice(0, 10)
    .map(b => ({
      id: b.id,
      titre: b.titre,
      ville: b.ville,
      nbFavoris: b.nbFavoris,
    }));

  return {
    favorisTotaux: biens.reduce((s, b) => s + b.nbFavoris, 0),
    topAnnonces,
  };
};

export interface StatsFavorisBien {
  favorisTotaux: number;
}

export const getStatsFavorisBien = async (bienId: string, proprietaireId: string): Promise<StatsFavorisBien> => {
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, proprietaireId },
    select: { nbFavoris: true },
  });

  if (!bien) throw new Error("Bien introuvable");

  return {
    favorisTotaux: bien.nbFavoris,
  };
};
