import * as BienRepository from "../repositories/bien.repository.js";
import type { BienWithRelations } from "../repositories/bien.repository.js";
import * as TypeLogementChampRepository from "../repositories/typeLogementChamp.repository.js";
import * as CloudinaryService from "./cloudinary.service.js";
import { sanitizeBienChamps } from "./bienChampsAuthorization.service.js";
import type { ListAnnoncesAdminQuery, SaveDraftInput } from "../validators/bien.validator.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { StatutAnnonce } from "../generated/prisma/enums.js";
import { prisma } from "../config/database.js";
import { computeScoreForProprietaire } from "./trustScore.service.js";
import { emitPropertyAlert, fetchAndEmitStatsGlobales, emitBienUpdated } from "./socket.service.js";
import { envoyerNotification } from "./notification.service.js";
import { getLogoFiligraneBuffer } from "./configSite.service.js";

// ─── Types établissements ─────────────────────────────────────────────────────

interface OverpassNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

const ETABLISSEMENT_QUERIES: { type: string; label: string; query: string }[] = [
  { type: "hopital", label: "Hôpital", query: '["amenity"="hospital"]' },
  { type: "pharmacie", label: "Pharmacie", query: '["amenity"="pharmacy"]' },
  { type: "ecole_maternelle", label: "École maternelle", query: '["amenity"="kindergarten"]' },
  { type: "ecole_primaire", label: "École primaire", query: '["amenity"="school"]["school"="primary"]' },
  { type: "college", label: "Collège", query: '["amenity"="school"]["school"="secondary"]' },
  { type: "lycee", label: "Lycée", query: '["amenity"="school"]["school"="high_school"]' },
  { type: "universite", label: "Université", query: '["amenity"="university"]' },
  { type: "supermarche", label: "Supermarché", query: '["shop"="supermarket"]' },
  { type: "marche", label: "Marché", query: '["amenity"="marketplace"]' },
  { type: "boulangerie", label: "Boulangerie", query: '["shop"="bakery"]' },
  { type: "mosquee", label: "Mosquée", query: '["amenity"="place_of_worship"]["religion"="muslim"]' },
  { type: "eglise", label: "Église", query: '["amenity"="place_of_worship"]["religion"="christian"]' },
  { type: "gendarmerie", label: "Gendarmerie", query: '["amenity"="police"]' },
  { type: "pompiers", label: "Caserne des pompiers", query: '["amenity"="fire_station"]' },
  { type: "mairie", label: "Mairie", query: '["amenity"="townhall"]' },
  { type: "arret_bus", label: "Arrêt de bus", query: '["highway"="bus_stop"]' },
  { type: "station_brt", label: "Station BRT", query: '["railway"="station"]' },
  { type: "route_principale", label: "Route principale", query: '["highway"="primary"]' },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function queryOverpass(
  lat: number,
  lon: number,
  queries: { type: string; label: string; query: string }[],
  radius: number
): Promise<{ elements: OverpassNode[]; ok: boolean }> {
  const unionParts = queries
    .map(({ query }) => `node${query}(around:${radius},${lat},${lon});`)
    .join("\n");
  const overpassQuery = `[out:json][timeout:25];\n(\n${unionParts}\n);\nout body;`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(overpassQuery)}`,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) return { elements: [], ok: false };
  const json = await response.json() as { elements: OverpassNode[] };
  return { elements: json.elements ?? [], ok: true };
}

function pickNearest(
  elements: OverpassNode[],
  lat: number,
  lon: number,
  queries: { type: string; label: string; query: string }[]
): Map<string, { node: OverpassNode; dist: number; label: string }> {
  const found = new Map<string, { node: OverpassNode; dist: number; label: string }>();
  for (const { type, label } of queries) {
    let nearest: OverpassNode | null = null;
    let nearestDist = Infinity;
    for (const el of elements) {
      if (!matchesType(el, type)) continue;
      const dist = haversineDistance(lat, lon, el.lat, el.lon);
      if (dist < nearestDist) { nearestDist = dist; nearest = el; }
    }
    if (nearest) found.set(type, { node: nearest, dist: nearestDist, label });
  }
  return found;
}

async function fetchNearestEtablissements(
  lat: number,
  lon: number
): Promise<BienRepository.EtablissementData[]> {
  const results: BienRepository.EtablissementData[] = [];

  try {
    // 1st pass — 5 km
    const { elements, ok } = await queryOverpass(lat, lon, ETABLISSEMENT_QUERIES, 5000);
    if (!ok) return results;

    const found = pickNearest(elements, lat, lon, ETABLISSEMENT_QUERIES);

    // Types absent from the 5 km radius
    const missing = ETABLISSEMENT_QUERIES.filter(({ type }) => !found.has(type));

    // 2nd pass — 50 km for missing types only
    if (missing.length > 0) {
      const { elements: elemsFar } = await queryOverpass(lat, lon, missing, 50000);
      const foundFar = pickNearest(elemsFar, lat, lon, missing);
      foundFar.forEach((v, type) => found.set(type, v));
    }

    found.forEach(({ node, dist, label }, type) => {
      results.push({
        bienId: "",
        type,
        nom: node.tags?.name ?? label,
        latitude: node.lat,
        longitude: node.lon,
        distance: Math.round(dist),
      });
    });
  } catch {
    // Overpass unavailable - silently skip
  }

  return results;
}

function matchesType(el: OverpassNode, type: string): boolean {
  const t = el.tags ?? {};
  switch (type) {
    case "hopital":          return t.amenity === "hospital";
    case "pharmacie":        return t.amenity === "pharmacy";
    case "ecole_maternelle": return t.amenity === "kindergarten";
    case "ecole_primaire":   return t.amenity === "school" && (t.school === "primary" || !t.school);
    case "college":          return t.amenity === "school" && t.school === "secondary";
    case "lycee":            return t.amenity === "school" && (t.school === "high_school" || t.school === "lycee");
    case "universite":       return t.amenity === "university";
    case "supermarche":      return t.shop === "supermarket";
    case "marche":           return t.amenity === "marketplace";
    case "boulangerie":      return t.shop === "bakery";
    case "mosquee":          return t.amenity === "place_of_worship" && t.religion === "muslim";
    case "eglise":           return t.amenity === "place_of_worship" && t.religion === "christian";
    case "gendarmerie":      return t.amenity === "police";
    case "pompiers":         return t.amenity === "fire_station";
    case "mairie":           return t.amenity === "townhall";
    case "arret_bus":        return t.highway === "bus_stop";
    case "station_brt":      return t.railway === "station";
    case "route_principale": return t.highway === "primary";
    default:                 return false;
  }
}

// ─── Brouillon ────────────────────────────────────────────────────────────────

export const getDraftByProprietaire = async (proprietaireId: string) => {
  return BienRepository.getDraftByProprietaire(proprietaireId);
};

export const saveDraft = async (
  input: SaveDraftInput,
  proprietaireId: string,
  photoFiles: Express.Multer.File[],
  videoFile?: Express.Multer.File
) => {
  const { existingPhotos = [], existingVideoUrl, disponibleLe, ...rest } = input;

  // Upload vidéo si fournie
  const uploadedVideoUrl = videoFile
    ? (await CloudinaryService.uploadVideo(videoFile.buffer, "seek/biens/videos")).url
    : undefined;
  const videoUrl = uploadedVideoUrl ?? existingVideoUrl ?? undefined;

  // Si un ID est fourni, mettre à jour le bien existant
  if (input.id) {
    const bien = await BienRepository.getBienById(input.id);

    if (!bien) {
      throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
    }
    if (bien.proprietaireId !== proprietaireId) {
      throw new AppError("Non autorisé", StatusCodes.FORBIDDEN);
    }

    const logoBuffer = photoFiles.length > 0 ? await getLogoFiligraneBuffer() : null;
    const newPhotoUrls = photoFiles.length > 0
      ? await Promise.all(photoFiles.map((file) => CloudinaryService.uploadImage(file.buffer, "seek/biens", undefined, logoBuffer).then((r) => r.url)))
      : [];

    const photos = [...(existingPhotos || []), ...newPhotoUrls];
    // typeLogementId peut ne pas être renvoyé dans un patch partiel : on retombe
    // sur celui déjà enregistré pour ne pas valider contre "aucun type".
    const effectiveTypeLogementId = rest.typeLogementId !== undefined ? rest.typeLogementId : bien.typeLogementId;
    const sanitizedChamps = await sanitizeBienChamps({ ...rest, typeLogementId: effectiveTypeLogementId });
    const data: BienRepository.BienData = {
      ...rest,
      ...sanitizedChamps,
      proprietaireId,
      photos,
      videoUrl: videoUrl ?? null,
      disponibleLe: disponibleLe ? new Date(disponibleLe) : null,
    };

    if (rest.prix !== undefined && bien.prix && rest.prix !== null && rest.prix < bien.prix) {
      const pourcentageBaisse = ((bien.prix - rest.prix) / bien.prix) * 100;
      if (pourcentageBaisse >= 5) {
        (data as any).prixAncien = bien.prix;
        (data as any).dateDerniereModificationPrix = new Date();
      }
    }

    return await BienRepository.updateBien(input.id, data);
  }

  // Sinon, utiliser le comportement existant (brouillon)
  const existing = await BienRepository.getDraftByProprietaire(proprietaireId);

  const logoBuffer = photoFiles.length > 0 ? await getLogoFiligraneBuffer() : null;
  const newPhotoUrls = photoFiles.length > 0
    ? await Promise.all(photoFiles.map((file) => CloudinaryService.uploadImage(file.buffer, "seek/biens", undefined, logoBuffer).then((r) => r.url)))
    : [];

  const photos = [...existingPhotos, ...newPhotoUrls];
  const sanitizedChamps = await sanitizeBienChamps(rest);
  const data: BienRepository.BienData = {
    ...rest,
    ...sanitizedChamps,
    proprietaireId,
    photos,
    videoUrl: videoUrl ?? null,
    disponibleLe: disponibleLe ? new Date(disponibleLe) : null,
    statutAnnonce: "BROUILLON",
  };

  let saved;
  if (existing) {
    saved = await BienRepository.updateBien(existing.id, data);
  } else {
    saved = await BienRepository.createBien(data);
  }
  return saved;
};

// ─── Soumettre pour publication ───────────────────────────────────────────────

export const soumettreAnnonce = async (bienId: string, proprietaireId: string) => {
  const bien = await BienRepository.getBienById(bienId);

  if (!bien) {
    throw new AppError("Annonce introuvable", StatusCodes.NOT_FOUND);
  }
  if (bien.proprietaireId !== proprietaireId) {
    throw new AppError("Non autorisé", StatusCodes.FORBIDDEN);
  }
  if (bien.statutAnnonce !== "BROUILLON" && bien.statutAnnonce !== "REJETE") {
    throw new AppError("Cette annonce ne peut pas être soumise dans son état actuel", StatusCodes.BAD_REQUEST);
  }

  // Validate required fields
  const missing: string[] = [];
  if (!bien.titre?.trim()) missing.push("titre");
  if (!bien.typeLogementId) missing.push("type de logement");
  if (!bien.typeTransactionId) missing.push("type de transaction");
  if (!bien.statutBienId) missing.push("statut du bien");
  if (!bien.region?.trim()) missing.push("région");
  if (bien.prix === null || bien.prix === undefined) missing.push("prix");
  if (!bien.photos || bien.photos.length < 3) missing.push("au moins 3 photos");

  if (bien.typeLogementId) {
    const champsConfig = await TypeLogementChampRepository.findByTypeLogement(bien.typeLogementId);
    const valeursParChamp = new Map(bien.champsValeurs?.map((cv) => [cv.champId, cv.valeur]) ?? []);
    for (const cfg of champsConfig) {
      if (!cfg.obligatoire) continue;
      if (cfg.champ.cleSysteme) {
        // Champ "système" : la valeur vit sur une colonne statique de Bien, pas dans champsValeurs.
        const valeur = (bien as unknown as Record<string, unknown>)[cfg.champ.cleSysteme];
        const isEmpty = valeur === null || valeur === undefined || valeur === "";
        if (isEmpty) missing.push(cfg.champ.nom);
        continue;
      }
      const valeur = valeursParChamp.get(cfg.champId)?.trim();
      if (!valeur) missing.push(cfg.champ.nom);
    }
  }

  if (missing.length > 0) {
    throw new AppError(
      `Champs requis manquants pour la publication : ${missing.join(", ")}`,
      StatusCodes.BAD_REQUEST
    );
  }

  const updated = await BienRepository.updateStatutAnnonce(bienId, "EN_ATTENTE");

  // Stats admin temps réel + notification admin (nouvelle annonce en attente de validation)
  fetchAndEmitStatsGlobales().catch(() => null);
  emitBienUpdated(proprietaireId, bienId);

  // Register nearby establishments asynchronously
  if (bien.latitude && bien.longitude) {
    fetchNearestEtablissements(bien.latitude, bien.longitude)
      .then(async (etablissements) => {
        const withBienId = etablissements.map((e) => ({ ...e, bienId: bien.id }));
        await BienRepository.createEtablissements(withBienId);
      })
      .catch(() => {});
  }

  return updated;
};

// ─── Biens du propriétaire ────────────────────────────────────────────────────

export const getBiensByProprietaire = async (proprietaireId: string) => {
  const biens = await BienRepository.getBiensByProprietaire(proprietaireId);
  return biens.map(({ bails, ...bien }) => ({
    ...bien,
    hasBailActif: bails.length > 0,
  }));
};

export const getBienById = async (id: string) => {
  return BienRepository.getBienById(id);
};

// ─── Nettoyage Cloudinary d'un bien (photos + documents + photos état des lieux) ──

const deleteCloudinaryForBien = async (bienId: string): Promise<void> => {
  const [bien, docs] = await Promise.all([
    prisma.bien.findUnique({ where: { id: bienId }, select: { photos: true } }),
    prisma.documentBien.findMany({ where: { bienId }, select: { url: true } }),
  ]);
  const urls: (string | null | undefined)[] = [
    ...(bien?.photos ?? []),
    ...docs.map((d) => d.url),
  ];
  await CloudinaryService.deleteUrls(urls);
};

export const deleteBien = async (bienId: string, proprietaireId: string) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Non autorisé", StatusCodes.FORBIDDEN);
  const activeBail = await prisma.bailLocation.findFirst({
    where: { bienId, statut: "ACTIF" },
    select: { id: true },
  });
  if (activeBail) {
    throw new AppError(
      "Ce bien est associé à un locataire actif. Terminez ou résiliez le bail avant de supprimer.",
      StatusCodes.BAD_REQUEST
    );
  }
  await deleteCloudinaryForBien(bienId);
  return BienRepository.deleteBienById(bienId);
};

export const retourBrouillon = async (bienId: string, proprietaireId: string) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Non autorisé", StatusCodes.FORBIDDEN);
  if (bien.statutAnnonce !== "EN_ATTENTE" && bien.statutAnnonce !== "PUBLIE") {
    throw new AppError("Cette action n'est pas disponible pour ce statut", StatusCodes.BAD_REQUEST);
  }
  return BienRepository.updateStatutAnnonce(bienId, "BROUILLON");
};

// ─── Annuler une annonce (= suppression définitive) ──────────────────────────

export const annulerAnnonce = async (bienId: string, proprietaireId: string) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Non autorisé", StatusCodes.FORBIDDEN);

  if (bien.statutAnnonce !== "BROUILLON" && bien.statutAnnonce !== "REJETE") {
    throw new AppError(
      "Seules les annonces en brouillon ou rejetées peuvent être supprimées via cette action",
      StatusCodes.BAD_REQUEST
    );
  }

  const activeBail = await prisma.bailLocation.findFirst({
    where: { bienId, statut: "ACTIF" },
    select: { id: true },
  });
  if (activeBail) {
    throw new AppError(
      "Ce bien est associé à un locataire actif. Terminez ou résiliez le bail avant de supprimer.",
      StatusCodes.BAD_REQUEST
    );
  }

  return BienRepository.deleteBienById(bienId);
};

// ─── Admin - annonces ─────────────────────────────────────────────────────────

export const countAnnoncesPending = async () => {
  return BienRepository.countAnnoncesPending();
};

export const getAnnoncesCounts = async () => {
  return BienRepository.getAnnoncesCounts();
};

// La référence affichée « SK-4F2A9C1B » reprend les 8 premiers caractères de l'UUID :
// un mot de recherche est donc aussi comparé au début de l'identifiant.
const PREFIXE_REFERENCE = /^sk-?/i;
const DEBUT_UUID = /^[0-9a-f]{1,8}$/;

const versMotRecherche = (mot: string) => {
  const reference = mot.replace(PREFIXE_REFERENCE, "").toLowerCase();
  return { texte: mot, prefixeId: DEBUT_UUID.test(reference) ? reference : undefined };
};

export const getAnnonces = async (params: ListAnnoncesAdminQuery) => {
  const mots = (params.search ?? "").split(/\s+/).filter(Boolean).map(versMotRecherche);
  return BienRepository.getAnnonces({
    statut: params.statut,
    page: params.page,
    limit: params.limit,
    mots,
    ville: params.ville || undefined,
    typeLogementId: params.typeLogementId,
    signalees: params.signalees,
  });
};

export const validerAnnonce = async (
  bienId: string,
  action: "APPROUVER" | "REJETER",
  note?: string
) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Annonce introuvable", StatusCodes.NOT_FOUND);

  if (bien.statutAnnonce !== "EN_ATTENTE") {
    throw new AppError("Cette annonce n'est pas en attente de validation", StatusCodes.BAD_REQUEST);
  }

  const newStatut: StatutAnnonce = action === "APPROUVER" ? "PUBLIE" : "REJETE";
  const result = await BienRepository.updateStatutAnnonce(bienId, newStatut, note);
  const bienTitre = result.titre ?? "votre annonce";

  // Notification in-app au propriétaire
  const proprietaire = result.proprietaire;
  if (proprietaire) {
    if (action === "APPROUVER") {
      envoyerNotification({
        type: "ANNONCE_VALIDEE",
        target: "owner",
        telephone: proprietaire.telephone,
        email: proprietaire.email,
        sujet: "Annonce validée",
        contenu: `Votre annonce "${bienTitre}" a été validée et est maintenant publiée sur SEEK Immobilier.`,
        bienId,
        proprietaireId: proprietaire.id,
        noSmsEmail: true,
      }).catch(() => null);
    } else {
      envoyerNotification({
        type: "ANNONCE_REJETEE",
        target: "owner",
        telephone: proprietaire.telephone,
        email: proprietaire.email,
        sujet: "Annonce rejetée",
        contenu: `Votre annonce "${bienTitre}" a été rejetée${note ? ` : ${note}` : "."}`,
        bienId,
        proprietaireId: proprietaire.id,
        noSmsEmail: true,
      }).catch(() => null);
    }
  }

  // Alertes temps réel aux utilisateurs qui ont sauvegardé des critères
  if (action === "APPROUVER") {
    const alertesActives = await prisma.alerte.findMany({
      where: { statut: "ACTIVE" },
      include: {
        comptePublic: {
          select: {
            email: true,
          },
        },
      },
    });

    const normalize = (value?: string | null): string | null => {
      if (!value) return null;
      const normalized = value.trim().toLocaleLowerCase();
      return normalized.length > 0 ? normalized : null;
    };

    const matches = alertesActives.filter((alerte) => (
      (!normalize(alerte.typeLogement) || normalize(alerte.typeLogement) === normalize(result.typeLogement?.nom)) &&
      (!normalize(alerte.typeTransaction) || normalize(alerte.typeTransaction) === normalize(result.typeTransaction?.nom)) &&
      (!normalize(alerte.ville) || normalize(alerte.ville) === normalize(result.region ?? result.ville)) &&
      (!normalize(alerte.quartier) || normalize(alerte.quartier) === normalize(result.quartier)) &&
      (!alerte.prixMin || (result.prix && result.prix >= alerte.prixMin)) &&
      (!alerte.prixMax || (result.prix && result.prix <= alerte.prixMax))
    ));

    await Promise.allSettled(
      matches.map((alerte) =>
        envoyerNotification({
          type: "ALERTE",
          telephone: alerte.telephone,
          email: alerte.comptePublic?.email ?? undefined,
          sujet: "Nouvelle annonce correspondant à vos critères",
          contenu: `Une nouvelle annonce "${bienTitre}" correspondant à vos critères vient d'être ajoutée sur SEEK Immobilier.`,
          bienId,
        })
      )
    );

    emitPropertyAlert(bienId).catch(() => null);

    // Re-fetch établissements si la 1ère tentative (soumission) avait échoué
    if (result.latitude && result.longitude && result.etablissements?.length === 0) {
      fetchNearestEtablissements(result.latitude, result.longitude)
        .then(async (etablissements) => {
          if (etablissements.length === 0) return;
          const withBienId = etablissements.map((e) => ({ ...e, bienId }));
          await BienRepository.createEtablissements(withBienId);
        })
        .catch(() => {});
    }
  }

  return result;
};

export const adminDeleteBien = async (bienId: string) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  await deleteCloudinaryForBien(bienId);
  return BienRepository.deleteBienById(bienId);
};

// ─── Public - dernières annonces (pour page d'accueil) ───────────────────────────

export const getDernieresAnnonces = async (limit: number = 10) => {
  return BienRepository.getDernieresAnnonces(limit);
};

// ─── Public - lieux distincts ────────────────────────────────────────────────

export const getDistinctLieux = async () => {
  return BienRepository.getDistinctLieux();
};

// ─── Public - recherche avec filtres ──────────────────────────────────────────

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
  lat?: number;
  lng?: number;
  radius?: number;
}) => {
  return BienRepository.searchAnnoncePubliques(params);
};

// ─── Public - annonce publiée par ID ─────────────────────────────────────────────

export const getAnnoncePublieById = async (id: string) => {
  const bien = await BienRepository.getAnnoncePublieById(id);
  if (!bien) {
    throw new AppError("Annonce introuvable ou non publiée", StatusCodes.NOT_FOUND);
  }
  const scoreProprietaire = await computeScoreForProprietaire(bien.proprietaireId).catch(() => null);
  return { ...bien, scoreProprietaire };
};

// ─── Public - annonces similaires avec système de score ─────────────────────

export const getAnnoncesSimilaires = async (
  bienId: string,
  limit: number = 4
): Promise<BienWithRelations[]> => {
  // Récupérer le bien de référence pour avoir les infos complètes
  const bien = await BienRepository.getBienById(bienId);
  
  if (!bien) {
    return [];
  }
  
  // Appeler la nouvelle méthode avec score
  return BienRepository.getAnnoncesSimilairesWithScore(bienId, limit);
};
