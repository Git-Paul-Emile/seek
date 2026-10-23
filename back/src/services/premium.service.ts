import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";
import {
  FORMULES_PREMIUM,
  type FormulePremium,
  type ModePaiement,
  type PaiementSimuleResult,
  type ActivationPromotionResult,
} from "../types/premium.types.js";
import { emitTransactionStatus, fetchAndEmitStatsGlobales } from "./socket.service.js";

/**
 * Système unique de mise en avant des annonces (fusion de l'ancien "premium" et
 * de l'ancien "promotion"). Un propriétaire ne peut mettre en avant une annonce
 * qu'en passant par une formule payante (avec simulation de paiement) et
 * uniquement s'il reste une place disponible parmi les MAX_PLACES_MISE_EN_AVANT
 * annonces boostées simultanément affichées sur la page d'accueil.
 */

export const MAX_PLACES_MISE_EN_AVANT = 5;

// ─── Brique technique : places disponibles ─────────────────────────────────────

/**
 * Récupère l'état des places de mise en avant disponibles.
 * Si toutes les places sont occupées, indique la date de la prochaine libération
 * (fin de la mise en avant qui se termine le plus tôt).
 */
export const getPlacesDisponibles = async (excludeBienId?: string) => {
  const now = new Date();

  const actives = await prisma.bien.findMany({
    where: {
      estMisEnAvant: true,
      dateFinPromotion: { gte: now },
      ...(excludeBienId ? { id: { not: excludeBienId } } : {}),
    },
    select: { dateFinPromotion: true },
    orderBy: { dateFinPromotion: "asc" },
  });

  const placesUtilisees = actives.length;
  const placesDisponibles = Math.max(0, MAX_PLACES_MISE_EN_AVANT - placesUtilisees);
  const prochaineLiberation = placesDisponibles === 0 ? actives[0]?.dateFinPromotion ?? null : null;

  return {
    placesMax: MAX_PLACES_MISE_EN_AVANT,
    placesUtilisees,
    placesDisponibles,
    prochaineLiberation,
  };
};

/**
 * Vérifie qu'une place de mise en avant est disponible pour ce bien, sinon lève une
 * erreur explicite (avec la date de la prochaine libération) et notifie le propriétaire.
 * `bienId` est exclu du décompte s'il est déjà activement mis en avant (renouvellement).
 */
export const assertPlaceDisponible = async (bienId: string, proprietaireId: string) => {
  const { placesDisponibles, prochaineLiberation } = await getPlacesDisponibles(bienId);

  if (placesDisponibles > 0) return;

  const dateLisible = prochaineLiberation
    ? new Date(prochaineLiberation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "prochainement";

  const message = `Toutes les places de mise en avant sont occupées (${MAX_PLACES_MISE_EN_AVANT}/${MAX_PLACES_MISE_EN_AVANT}). Prochaine place disponible le ${dateLisible}.`;

  try {
    const { envoyerNotification } = await import("./notification.service.js");
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
      select: { telephone: true, email: true },
    });
    if (proprietaire) {
      await envoyerNotification({
        type: "ALERTE",
        target: "owner",
        telephone: proprietaire.telephone,
        email: proprietaire.email,
        sujet: "Mise en avant indisponible",
        contenu: message,
        proprietaireId,
      });
    }
  } catch {
    // notification non bloquante
  }

  throw new AppError(message, StatusCodes.CONFLICT);
};

// ─── Formules payantes ──────────────────────────────────────────────────────────

const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SIM-${timestamp}-${random}`;
};

/**
 * Enregistre le cycle de mise en avant dans l'historique (utilisé par l'owner et l'admin).
 */
const savePromotionToHistory = async (params: {
  bienId: string;
  proprietaireId: string;
  transactionId: string;
  formule: FormulePremium;
  dateDebut: Date;
  dateFin: Date;
}) => {
  const { bienId, proprietaireId, transactionId, formule, dateDebut, dateFin } = params;
  return prisma.promotionHistory.create({
    data: {
      bienId,
      proprietaireId,
      transactionId,
      formuleId: formule.id,
      formuleNom: formule.nom,
      dureeJours: formule.dureeJours,
      montant: formule.prix,
      dateDebut,
      dateFin,
      statut: "ACTIVE",
    },
  });
};

/**
 * Vérifie la place disponible, simule le paiement d'une formule et active la mise
 * en avant du bien (affichage prioritaire sur la page d'accueil).
 *
 * NOTE: Le paiement est une SIMULATION. Une fois l'API de paiement réelle intégrée
 * (Orange Money, Wave, etc.), seule cette étape devra être remplacée.
 */
export const simulerPaiementEtActiverPromotion = async (
  bienId: string,
  proprietaireId: string,
  formuleId: string,
  modePaiement: ModePaiement
): Promise<{
  paiement: PaiementSimuleResult;
  promotion: ActivationPromotionResult;
}> => {
  // 1. Vérifier que le bien existe et appartient au propriétaire
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, proprietaireId },
  });
  if (!bien) {
    throw new AppError("Bien introuvable ou non autorisé", StatusCodes.NOT_FOUND);
  }

  // 2. Vérifier que l'annonce est publiée
  if (bien.statutAnnonce !== "PUBLIE") {
    throw new AppError(
      "Seules les annonces publiées peuvent être mises en avant",
      StatusCodes.BAD_REQUEST
    );
  }

  // 3. Vérifier que la formule existe (DB d'abord, puis fallback hardcoded)
  let formule: FormulePremium | undefined;
  const dbFormule = await prisma.formulePremium.findFirst({ where: { code: formuleId, actif: true } });
  if (dbFormule) {
    formule = {
      id: dbFormule.code,
      nom: dbFormule.nom,
      dureeJours: dbFormule.dureeJours,
      prix: dbFormule.prix,
      accroche: dbFormule.accroche,
      description: dbFormule.description,
      idealPour: dbFormule.idealPour,
      populer: dbFormule.populer,
    };
  } else {
    formule = FORMULES_PREMIUM.find((f) => f.id === formuleId);
  }
  if (!formule) {
    throw new AppError("Formule premium introuvable", StatusCodes.NOT_FOUND);
  }

  // 4. Vérifier qu'une place de mise en avant est disponible AVANT de débiter le propriétaire
  await assertPlaceDisponible(bienId, proprietaireId);

  // 5. SIMULATION DU PAIEMENT
  const paiementResult: PaiementSimuleResult = {
    success: true,
    transactionId: generateTransactionId(),
    montant: formule.prix,
    modePaiement,
    formule,
    datePaiement: new Date(),
    message: "Paiement effectué avec succès (simulation)",
  };

  // 6. Enregistrer la transaction dans l'historique des paiements
  const transaction = await prisma.transaction.create({
    data: {
      proprietaireId,
      type: "PAIEMENT_PREMIUM",
      statut: "CONFIRME",
      montant: formule.prix,
      devise: "XOF",
      modePaiement,
      provider: modePaiement,
      transactionId: paiementResult.transactionId,
      bienId,
      dateConfirmation: new Date(),
      instructions: "Paiement simulation - Mise en avant d'annonce",
      metadata: {
        formuleId: formule.id,
        formuleNom: formule.nom,
        dureeJours: formule.dureeJours,
      },
    },
  });

  emitTransactionStatus({
    transactionId: transaction.id,
    proprietaireId,
    statut: "CONFIRME",
    montant: formule.prix,
    type: "PAIEMENT_PREMIUM",
    bienId,
    updatedAt: new Date().toISOString(),
  });
  fetchAndEmitStatsGlobales().catch(() => null);

  // 7. Activer la mise en avant du bien
  const now = new Date();
  const dateFin = new Date(now);
  dateFin.setDate(dateFin.getDate() + formule.dureeJours);

  const updated = await prisma.bien.update({
    where: { id: bienId },
    data: {
      estMisEnAvant: true,
      dateDebutPromotion: now,
      dateFinPromotion: dateFin,
      positionRotation: 0,
      dernierAffichage: null,
    },
  });

  const promotionResult: ActivationPromotionResult = {
    success: true,
    message: "Annonce mise en avant avec succès",
    data: {
      bienId: updated.id,
      titre: bien.titre ?? undefined,
      estMisEnAvant: updated.estMisEnAvant,
      dateDebutPromotion: updated.dateDebutPromotion,
      dateFinPromotion: updated.dateFinPromotion,
      positionRotation: updated.positionRotation,
    },
  };

  // 8. Enregistrer le cycle dans l'historique des mises en avant (owner + admin)
  try {
    await savePromotionToHistory({
      bienId,
      proprietaireId,
      transactionId: paiementResult.transactionId,
      formule,
      dateDebut: now,
      dateFin,
    });
  } catch (error) {
    console.warn("[PREMIUM] Impossible d'enregistrer l'historique de mise en avant:", error);
  }

  return {
    paiement: paiementResult,
    promotion: promotionResult,
  };
};

/**
 * Récupère les formules premium disponibles (DB d'abord, fallback hardcoded)
 */
export const getFormulesPremium = async (): Promise<FormulePremium[]> => {
  const dbFormules = await prisma.formulePremium.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } });
  if (dbFormules.length > 0) {
    return dbFormules.map((f) => ({
      id: f.code,
      nom: f.nom,
      dureeJours: f.dureeJours,
      prix: f.prix,
      accroche: f.accroche,
      description: f.description,
      idealPour: f.idealPour,
      populer: f.populer,
    }));
  }
  return FORMULES_PREMIUM;
};

// ─── Admin CRUD FormulePremium ────────────────────────────────────────────────

export const adminGetAllFormules = async () => {
  return prisma.formulePremium.findMany({ orderBy: { ordre: "asc" } });
};

export const adminCreateFormule = async (data: {
  code: string; nom: string; dureeJours: number; prix: number;
  accroche: string; description: string; idealPour: string[]; populer?: boolean;
  actif?: boolean; ordre?: number;
}) => {
  return prisma.formulePremium.create({ data });
};

export const adminUpdateFormule = async (id: string, data: Partial<{
  code: string; nom: string; dureeJours: number; prix: number;
  accroche: string; description: string; idealPour: string[]; populer: boolean;
  actif: boolean; ordre: number;
}>) => {
  return prisma.formulePremium.update({ where: { id }, data });
};

export const adminDeleteFormule = async (id: string) => {
  return prisma.formulePremium.delete({ where: { id } });
};

/**
 * Arrête la mise en avant d'un bien avant la fin prévue (à l'initiative du propriétaire)
 * Le propriétaire perd les jours restants.
 */
export const arreterMiseEnAvant = async (
  bienId: string,
  proprietaireId: string
): Promise<{
  success: boolean;
  message: string;
  historique?: any;
}> => {
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, proprietaireId },
  });
  if (!bien) {
    throw new AppError("Bien introuvable ou non autorisé", StatusCodes.NOT_FOUND);
  }

  if (!bien.estMisEnAvant || !bien.dateFinPromotion || !bien.dateDebutPromotion) {
    throw new AppError(
      "Ce bien n'est pas actuellement en mise en avant",
      StatusCodes.BAD_REQUEST
    );
  }

  const now = new Date();
  const dateFinPrevue = new Date(bien.dateFinPromotion);

  if (dateFinPrevue <= now) {
    throw new AppError(
      "Cette mise en avant est déjà terminée",
      StatusCodes.BAD_REQUEST
    );
  }

  const joursRestants = Math.ceil(
    (dateFinPrevue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  await prisma.bien.update({
    where: { id: bienId },
    data: {
      estMisEnAvant: false,
      dateFinPromotion: now,
      positionRotation: 0,
    },
  });

  const historique = await prisma.promotionHistory.updateMany({
    where: { bienId, statut: "ACTIVE" },
    data: {
      statut: "ARRETEE",
      dateFinReelle: now,
      joursRestants,
    },
  });

  return {
    success: true,
    message: `Mise en avant arrêtée. Vous avez perdu les ${joursRestants} jour(s) restant(s).`,
    historique,
  };
};

/**
 * Récupère l'historique des mises en avant d'un bien
 */
export const getHistoriqueMisesEnAvant = async (
  bienId: string,
  proprietaireId: string
) => {
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, proprietaireId },
  });
  if (!bien) {
    throw new AppError("Bien introuvable ou non autorisé", StatusCodes.NOT_FOUND);
  }

  return prisma.promotionHistory.findMany({
    where: { bienId },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Récupère l'historique des mises en avant d'un propriétaire (tous ses biens)
 */
export const getHistoriqueMisesEnAvantProprietaire = async (
  proprietaireId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  const [historique, total] = await Promise.all([
    prisma.promotionHistory.findMany({
      where: { proprietaireId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        bien: { select: { id: true, titre: true, photos: true, ville: true, quartier: true } },
      },
    }),
    prisma.promotionHistory.count({ where: { proprietaireId } }),
  ]);

  return {
    data: historique,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Affichage page d'accueil (public) et statut (owner) ───────────────────────

/**
 * Récupère les annonces actuellement mises en avant pour la page d'accueil.
 * Le nombre de places étant plafonné (MAX_PLACES_MISE_EN_AVANT), toutes les
 * annonces actives sont affichées simultanément, sans rotation.
 */
export const getAnnoncesMiseEnAvant = async (limit: number = MAX_PLACES_MISE_EN_AVANT) => {
  const now = new Date();

  const annonces = await prisma.bien.findMany({
    where: {
      estMisEnAvant: true,
      dateFinPromotion: { gte: now },
      statutAnnonce: "PUBLIE",
      actif: true,
    },
    orderBy: { dateDebutPromotion: "asc" },
    take: limit,
    include: {
      typeLogement: true,
      typeTransaction: true,
      statutBien: true,
      proprietaire: {
        select: { id: true, prenom: true, nom: true, telephone: true, statutVerification: true },
      },
    },
  });

  return {
    annonces,
    total: annonces.length,
    placesDisponibles: Math.max(0, MAX_PLACES_MISE_EN_AVANT - annonces.length),
    message: annonces.length > 0
      ? `Affichage de ${annonces.length} annonce(s) mise(s) en avant`
      : "Aucune annonce mise en avant actuellement",
  };
};

/**
 * Récupère le statut de mise en avant d'une annonce (pour le propriétaire)
 */
export const getPromotionStatus = async (bienId: string, proprietaireId: string) => {
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, proprietaireId },
  });
  if (!bien) {
    throw new AppError("Bien introuvable ou non autorisé", StatusCodes.NOT_FOUND);
  }

  const now = new Date();
  const isActive =
    bien.estMisEnAvant &&
    bien.dateFinPromotion !== null &&
    new Date(bien.dateFinPromotion) >= now;

  return {
    bienId: bien.id,
    estMisEnAvant: isActive,
    dateDebutPromotion: bien.dateDebutPromotion,
    dateFinPromotion: bien.dateFinPromotion,
    positionRotation: bien.positionRotation,
    dernierAffichage: bien.dernierAffichage,
    joursRestants: isActive && bien.dateFinPromotion
      ? Math.ceil(
          (new Date(bien.dateFinPromotion).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0,
  };
};

// ─── Admin : supervision globale ────────────────────────────────────────────────

/**
 * Admin : arrête manuellement une mise en avant active et notifie le propriétaire
 */
export const adminArreterPromotion = async (promotionId: string, motif?: string) => {
  const promotion = await prisma.promotionHistory.findUnique({
    where: { id: promotionId },
    include: {
      bien: { select: { id: true, titre: true, dateDebutPromotion: true } },
      proprietaire: { select: { id: true, prenom: true, nom: true, telephone: true, email: true } },
    },
  });

  if (!promotion) throw new AppError("Mise en avant introuvable", StatusCodes.NOT_FOUND);
  if (promotion.statut !== "ACTIVE") throw new AppError("Seules les mises en avant actives peuvent être arrêtées", StatusCodes.BAD_REQUEST);

  const now = new Date();
  const motifFinal = motif ?? "Arrêtée par l'administrateur";

  await prisma.promotionHistory.update({
    where: { id: promotionId },
    data: { statut: "ARRETEE", dateFinReelle: now, motifArret: motifFinal },
  });

  if (promotion.bien) {
    const bien = await prisma.bien.findUnique({
      where: { id: promotion.bien.id },
      select: { estMisEnAvant: true, dateDebutPromotion: true },
    });
    const memeDebut =
      bien?.dateDebutPromotion &&
      Math.abs(new Date(bien.dateDebutPromotion).getTime() - new Date(promotion.dateDebut).getTime()) < 60_000;

    if (bien?.estMisEnAvant && memeDebut) {
      await prisma.bien.update({
        where: { id: promotion.bien.id },
        data: { estMisEnAvant: false, dateDebutPromotion: null, dateFinPromotion: null, positionRotation: 0, dernierAffichage: null },
      });
    }
  }

  if (promotion.proprietaire) {
    try {
      const { envoyerNotification } = await import("./notification.service.js");
      await envoyerNotification({
        type: "ALERTE",
        telephone: promotion.proprietaire.telephone,
        email: promotion.proprietaire.email,
        sujet: "Mise en avant arrêtée par l'administrateur",
        contenu: `Bonjour ${promotion.proprietaire.prenom},\n\nVotre mise en avant pour "${promotion.bien?.titre ?? "votre bien"}" a été arrêtée par l'administrateur.\nMotif : ${motifFinal}.\n\nPour toute question, contactez le support.`,
        proprietaireId: promotion.proprietaireId,
        bienId: promotion.bienId ?? undefined,
      });
    } catch {
      // notification non bloquante
    }
  }

  return { success: true, message: "Mise en avant arrêtée et propriétaire notifié" };
};

/**
 * Détecte les mises en avant expirées, les marque EXPIREE et notifie les propriétaires
 */
export const traiterPromotionsExpirees = async () => {
  const now = new Date();

  const actives = await prisma.promotionHistory.findMany({
    where: { statut: "ACTIVE", dateFin: { lt: now } },
    include: {
      bien: { select: { id: true, titre: true, estMisEnAvant: true, dateDebutPromotion: true } },
      proprietaire: { select: { id: true, prenom: true, nom: true, telephone: true, email: true } },
    },
  });

  for (const p of actives) {
    await prisma.promotionHistory.update({
      where: { id: p.id },
      data: { statut: "EXPIREE", dateFinReelle: now },
    });

    if (p.bien?.estMisEnAvant) {
      await prisma.bien.update({
        where: { id: p.bien.id },
        data: { estMisEnAvant: false, dateDebutPromotion: null, dateFinPromotion: null, positionRotation: 0, dernierAffichage: null },
      });
    }

    if (p.proprietaire) {
      try {
        const { envoyerNotification } = await import("./notification.service.js");
        await envoyerNotification({
          type: "ALERTE",
          telephone: p.proprietaire.telephone,
          email: p.proprietaire.email,
          sujet: "Votre mise en avant a expiré",
          contenu: `Bonjour ${p.proprietaire.prenom},\n\nVotre mise en avant pour "${p.bien?.titre ?? "votre bien"}" a expiré. Pour continuer à booster votre annonce, activez une nouvelle mise en avant depuis votre tableau de bord.`,
          proprietaireId: p.proprietaireId,
          bienId: p.bienId ?? undefined,
        });
      } catch {}
    }
  }

  return { traite: actives.length };
};

/**
 * Admin : historique paginé de toutes les mises en avant
 */
export const adminGetHistorique = async (params: {
  page?: number;
  limit?: number;
  statut?: string;
  proprietaireId?: string;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.statut) where.statut = params.statut;
  if (params.proprietaireId) where.proprietaireId = params.proprietaireId;

  const [total, data] = await Promise.all([
    prisma.promotionHistory.count({ where }),
    prisma.promotionHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        bien: { select: { id: true, titre: true, ville: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, telephone: true } },
      },
    }),
  ]);

  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

/**
 * Admin : statistiques globales des mises en avant
 */
export const adminGetStats = async () => {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, actives, montantTotal, montantMois, parFormule] = await Promise.all([
    prisma.promotionHistory.count(),
    prisma.promotionHistory.count({ where: { statut: "ACTIVE" } }),
    prisma.promotionHistory.aggregate({ _sum: { montant: true } }),
    prisma.promotionHistory.aggregate({ where: { createdAt: { gte: debutMois } }, _sum: { montant: true } }),
    prisma.promotionHistory.groupBy({ by: ["formuleNom"], _count: true, _sum: { montant: true } }),
  ]);

  return {
    total,
    actives,
    montantTotal: montantTotal._sum.montant ?? 0,
    montantMois: montantMois._sum.montant ?? 0,
    parFormule: parFormule.map((r) => ({ formuleNom: r.formuleNom, count: r._count, montant: r._sum.montant ?? 0 })),
  };
};
