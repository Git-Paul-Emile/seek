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
import { randomUUID } from "node:crypto";
import { planifierTraitementMedias, type FichierMedia } from "./mediasBien.queue.js";
import { EtablissementsIndisponiblesError, rechercherEtablissementsProches } from "./overpass.service.js";

// ─── Établissements proches ───────────────────────────────────────────────────

/**
 * Cherche et enregistre les établissements proches d'un bien. Rien n'est enregistré si le
 * service est indisponible : la recherche sera relancée au prochain affichage de l'annonce.
 */
async function enregistrerEtablissementsProches(bienId: string, latitude: number, longitude: number) {
  const dejaEnregistres = await BienRepository.getEtablissementsByBien(bienId);
  if (dejaEnregistres.length > 0) return dejaEnregistres;
  const etablissements = await rechercherEtablissementsProches(latitude, longitude);
  if (etablissements.length === 0) return [];
  // Une autre requête a pu enregistrer la liste pendant la recherche.
  const existants = await BienRepository.getEtablissementsByBien(bienId);
  if (existants.length > 0) return existants;
  await BienRepository.createEtablissements(etablissements.map((e) => ({ ...e, bienId })));
  return BienRepository.getEtablissementsByBien(bienId);
}

const journaliserEchecEtablissements = (bienId: string) => (erreur: unknown) => {
  console.warn(`[etablissements] recherche impossible pour le bien ${bienId} :`, erreur instanceof Error ? erreur.message : erreur);
};

// ─── Brouillon ────────────────────────────────────────────────────────────────

export const getDraftByProprietaire = async (proprietaireId: string) => {
  return BienRepository.getDraftByProprietaire(proprietaireId);
};

const versFichierMedia = (file: Express.Multer.File): FichierMedia => ({ chemin: file.path, cle: randomUUID() });

/**
 * Enregistre le brouillon (ou les modifications d'un bien) sans attendre l'envoi des fichiers.
 * Les nouvelles photos et la vidéo sont confiées à la file « medias-bien », qui les ajoute au
 * bien puis, si demandé, soumet l'annonce. Renvoie le bien et l'identifiant de ce traitement.
 */
export const saveDraft = async (
  input: SaveDraftInput,
  proprietaireId: string,
  photoFiles: Express.Multer.File[],
  videoFile?: Express.Multer.File
) => {
  const { existingPhotos = [], existingVideoUrl, disponibleLe, soumettre = false, ...rest } = input;
  const avecFichiers = photoFiles.length > 0 || Boolean(videoFile);

  let bienExistant: Awaited<ReturnType<typeof BienRepository.getBienById>> = null;
  if (input.id) {
    bienExistant = await BienRepository.getBienById(input.id);
    if (!bienExistant) {
      throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
    }
    if (bienExistant.proprietaireId !== proprietaireId) {
      throw new AppError("Non autorisé", StatusCodes.FORBIDDEN);
    }
  }

  // typeLogementId peut ne pas être renvoyé dans un patch partiel : on retombe
  // sur celui déjà enregistré pour ne pas valider contre "aucun type".
  const effectiveTypeLogementId =
    bienExistant && rest.typeLogementId === undefined ? bienExistant.typeLogementId : rest.typeLogementId;
  const sanitizedChamps = await sanitizeBienChamps({ ...rest, typeLogementId: effectiveTypeLogementId });
  const data: BienRepository.BienData = {
    ...rest,
    ...sanitizedChamps,
    proprietaireId,
    // Les nouvelles photos et la nouvelle vidéo sont ajoutées par le traitement en file.
    photos: existingPhotos,
    videoUrl: existingVideoUrl ?? null,
    disponibleLe: disponibleLe ? new Date(disponibleLe) : null,
  };

  let saved;
  if (bienExistant) {
    if (rest.prix !== undefined && bienExistant.prix && rest.prix !== null && rest.prix < bienExistant.prix) {
      const pourcentageBaisse = ((bienExistant.prix - rest.prix) / bienExistant.prix) * 100;
      if (pourcentageBaisse >= 5) {
        (data as any).prixAncien = bienExistant.prix;
        (data as any).dateDerniereModificationPrix = new Date();
      }
    }
    saved = await BienRepository.updateBien(bienExistant.id, data);
  } else {
    const existing = await BienRepository.getDraftByProprietaire(proprietaireId);
    const brouillon: BienRepository.BienData = { ...data, statutAnnonce: "BROUILLON" };
    saved = existing
      ? await BienRepository.updateBien(existing.id, brouillon)
      : await BienRepository.createBien(brouillon);
  }

  if (!avecFichiers) return { bien: saved, traitementId: null };

  // Refuser tout de suite une soumission incomplète plutôt qu'après l'envoi des fichiers.
  if (soumettre) {
    const manquants = await champsManquantsPublication(saved, saved.photos.length + photoFiles.length);
    if (manquants.length > 0) {
      throw new AppError(`Champs requis manquants pour la publication : ${manquants.join(", ")}`, StatusCodes.BAD_REQUEST);
    }
  }

  const traitementId = await planifierTraitementMedias({
    bienId: saved.id,
    proprietaireId,
    photos: photoFiles.map(versFichierMedia),
    video: videoFile ? versFichierMedia(videoFile) : null,
    soumettre,
  });
  return { bien: saved, traitementId };
};

/**
 * Ajoute au bien les médias envoyés par la file. Rejouable : une photo déjà présente avec la
 * même clé est remplacée, jamais dupliquée ; la vidéo remplace l'ancienne.
 */
export const ajouterMediasTraites = async (
  bienId: string,
  photos: { cle: string; url: string }[],
  video: { cle: string; url: string } | null
) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  const cles = photos.map((photo) => photo.cle);
  const conservees = bien.photos.filter((url) => !cles.some((cle) => url.includes(`/${cle}.`)));
  return BienRepository.updateBien(bienId, {
    proprietaireId: bien.proprietaireId,
    photos: [...conservees, ...photos.map((photo) => photo.url)],
    ...(video ? { videoUrl: video.url } : {}),
  });
};

/** Champs lus pour décider si un bien peut être publié. */
interface BienAPublier {
  titre: string | null;
  typeLogementId: string | null;
  typeTransactionId: string | null;
  statutBienId: string | null;
  region: string | null;
  prix: number | null;
  champsValeurs?: { champId: string; valeur: string }[];
}

/** Champs requis manquants pour publier ce bien, avec nbPhotos photos au total. */
const champsManquantsPublication = async (
  bien: BienAPublier,
  nbPhotos: number
): Promise<string[]> => {
  const missing: string[] = [];
  if (!bien.titre?.trim()) missing.push("titre");
  if (!bien.typeLogementId) missing.push("type de logement");
  if (!bien.typeTransactionId) missing.push("type de transaction");
  if (!bien.statutBienId) missing.push("statut du bien");
  if (!bien.region?.trim()) missing.push("région");
  if (bien.prix === null || bien.prix === undefined) missing.push("prix");
  if (nbPhotos < 3) missing.push("au moins 3 photos");

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
  return missing;
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

  const missing = await champsManquantsPublication(bien, bien.photos?.length ?? 0);
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

  // Établissements proches recherchés en arrière-plan, sans bloquer la soumission
  if (bien.latitude && bien.longitude) {
    enregistrerEtablissementsProches(bien.id, bien.latitude, bien.longitude).catch(journaliserEchecEtablissements(bien.id));
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

    // Nouvelle tentative si la recherche lancée à la soumission avait échoué
    if (result.latitude && result.longitude && result.etablissements?.length === 0) {
      enregistrerEtablissementsProches(bienId, result.latitude, result.longitude).catch(journaliserEchecEtablissements(bienId));
    }
  }

  return result;
};

// ─── Gestion d'une annonce par l'admin ───────────────────────────────────────

const notifierProprietaireAnnonce = (
  bien: Awaited<ReturnType<typeof BienRepository.updateStatutAnnonce>>,
  type: "ANNONCE_VALIDEE" | "ANNONCE_REJETEE" | "ANNONCE_MODIFIEE",
  sujet: string,
  contenu: string
) => {
  const proprietaire = bien.proprietaire;
  if (!proprietaire) return;
  envoyerNotification({
    type,
    target: "owner",
    telephone: proprietaire.telephone,
    email: proprietaire.email,
    sujet,
    contenu,
    bienId: bien.id,
    proprietaireId: proprietaire.id,
    noSmsEmail: true,
  }).catch(() => null);
};

const signalerChangementAnnonce = (bien: { id: string; proprietaireId: string }) => {
  fetchAndEmitStatsGlobales().catch(() => null);
  emitBienUpdated(bien.proprietaireId, bien.id);
};

/**
 * Retire une annonce publiée : elle repasse au statut REJETE avec la note de l'admin.
 * Le propriétaire corrige puis la soumet de nouveau, comme après un rejet de modération.
 */
export const retirerAnnonce = async (bienId: string, note: string) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Annonce introuvable", StatusCodes.NOT_FOUND);
  if (bien.statutAnnonce !== "PUBLIE") {
    throw new AppError("Seule une annonce publiée peut être retirée de la publication", StatusCodes.BAD_REQUEST);
  }
  const result = await BienRepository.updateStatutAnnonce(bienId, "REJETE", note);
  notifierProprietaireAnnonce(
    result,
    "ANNONCE_REJETEE",
    "Annonce retirée de la publication",
    `Votre annonce "${result.titre ?? "sans titre"}" a été retirée de la publication : ${note}`
  );
  signalerChangementAnnonce(result);
  return result;
};

/** Remet en ligne une annonce retirée ou rejetée, sans nouvelle soumission du propriétaire. */
export const republierAnnonce = async (bienId: string) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Annonce introuvable", StatusCodes.NOT_FOUND);
  if (bien.statutAnnonce !== "REJETE") {
    throw new AppError("Seule une annonce retirée ou rejetée peut être republiée", StatusCodes.BAD_REQUEST);
  }
  const result = await BienRepository.updateStatutAnnonce(bienId, "PUBLIE", null);
  notifierProprietaireAnnonce(
    result,
    "ANNONCE_VALIDEE",
    "Annonce republiée",
    `Votre annonce "${result.titre ?? "sans titre"}" est de nouveau publiée sur SEEK Immobilier.`
  );
  signalerChangementAnnonce(result);
  return result;
};

/** Corrige le titre, la description ou le prix d'une annonce ; le propriétaire est prévenu. */
export const adminModifierAnnonce = async (
  bienId: string,
  data: { titre?: string; description?: string; prix?: number }
) => {
  const bien = await BienRepository.getBienById(bienId);
  if (!bien) throw new AppError("Annonce introuvable", StatusCodes.NOT_FOUND);
  if (bien.statutAnnonce === "BROUILLON") {
    throw new AppError("Un brouillon appartient encore au propriétaire : il ne peut pas être modifié", StatusCodes.BAD_REQUEST);
  }
  const result = await BienRepository.updateContenuAnnonce(bienId, data);
  const champs = [data.titre !== undefined && "le titre", data.description !== undefined && "la description", data.prix !== undefined && "le prix"]
    .filter(Boolean)
    .join(", ");
  notifierProprietaireAnnonce(
    result,
    "ANNONCE_MODIFIEE",
    "Annonce modifiée par l'équipe Seek",
    `L'équipe Seek a corrigé ${champs} de votre annonce "${result.titre ?? "sans titre"}".`
  );
  signalerChangementAnnonce(result);
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

/**
 * Établissements proches d'une annonce publiée : la liste enregistrée, sinon une recherche
 * immédiate, enregistrée pour les visites suivantes.
 */
export const getEtablissementsAnnoncePublie = async (id: string) => {
  const bien = await BienRepository.getAnnoncePublieById(id);
  if (!bien) {
    throw new AppError("Annonce introuvable ou non publiée", StatusCodes.NOT_FOUND);
  }
  if (bien.latitude === null || bien.longitude === null) return [];
  try {
    return await enregistrerEtablissementsProches(bien.id, bien.latitude, bien.longitude);
  } catch (erreur) {
    if (erreur instanceof EtablissementsIndisponiblesError) {
      throw new AppError("Les lieux utiles autour du bien sont momentanément indisponibles.", StatusCodes.SERVICE_UNAVAILABLE);
    }
    throw erreur;
  }
};

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
