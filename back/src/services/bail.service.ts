import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as BailRepo from "../repositories/bail.repository.js";
import { prisma } from "../config/database.js";
import type { EcheancierLoyerCreateManyInput } from "../generated/prisma/models/EcheancierLoyer.js";
import { genererQuittanceInterne } from "./quittance.service.js";
import {
  envoyerConfirmationPaiement,
  envoyerConfirmationPaiementProprietaire,
  envoyerPaiementLocataire,
  envoyerPreavisLocataire,
  envoyerPreavisProprietaire,
  envoyerResiliationLocataire,
  envoyerResiliationProprietaire,
  envoyerFinBailLocataire,
  envoyerPaiementEspecesLocataire,
  envoyerConfirmationEspecesProprietaire,
} from "./notification.service.js";
import { getConfig } from "./configMonetisation.service.js";
import { emitTransactionStatus, emitBadgeUpdate, fetchAndEmitStatsGlobales, emitBailUpdated, emitBienUpdated } from "./socket.service.js";

// ─── Génération de l'échéancier ───────────────────────────────────────────────

function advanceByFrequence(date: Date, frequence: string): Date {
  const next = new Date(date);
  switch (frequence) {
    case "journalier":   next.setDate(next.getDate() + 1); break;
    case "hebdomadaire": next.setDate(next.getDate() + 7); break;
    case "trimestriel":  next.setMonth(next.getMonth() + 3); break;
    case "semestriel":   next.setMonth(next.getMonth() + 6); break;
    case "annuel":       next.setFullYear(next.getFullYear() + 1); break;
    default:             next.setMonth(next.getMonth() + 1); // mensuel
  }
  return next;
}

interface GenererEcheancesParams {
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
  dateDebut: Date;
  dateFin: Date | null;
  frequence: string;
  montant: number;
  dateMax?: Date;
}

function genererEcheances(params: GenererEcheancesParams): EcheancierLoyerCreateManyInput[] {
  const { bailId, bienId, proprietaireId, locataireId, dateDebut, dateFin, frequence, montant, dateMax } = params;
  const MAX = 36;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const echeances: EcheancierLoyerCreateManyInput[] = [];
  let current = new Date(dateDebut);
  while (echeances.length < MAX) {
    if (dateFin && current > dateFin) break;
    if (dateMax && current > dateMax) break;
    const due = new Date(current);
    due.setHours(0, 0, 0, 0);
    const statut = due <= today ? "EN_ATTENTE" as const : "A_VENIR" as const;
    echeances.push({
      bailId, bienId, proprietaireId, locataireId,
      dateEcheance: new Date(current),
      montant, statut,
    });
    current = advanceByFrequence(current, frequence);
  }
  return echeances;
}

// ─── Helpers messages bail ────────────────────────────────────────────────────

interface MsgInterneParams {
  userId: string;
  bailId: string;
  bienId: string;
  type: string;
  titre: string;
  corps: string;
}

const msgProprietaire = (p: MsgInterneParams) =>
  prisma.messageInterne.create({ data: { proprietaireId: p.userId, bailId: p.bailId, bienId: p.bienId, titre: p.titre, corps: p.corps, type: p.type } });

const msgLocataire = (p: MsgInterneParams) =>
  prisma.messageInterneLocataire.create({ data: { locataireId: p.userId, bailId: p.bailId, bienId: p.bienId, titre: p.titre, corps: p.corps, type: p.type } });

const ensurePreviousUnpaidCleared = async (bailId: string, dateEcheance: Date) => {
  const precedente = await prisma.echeancierLoyer.findFirst({
    where: {
      bailId,
      dateEcheance: { lt: dateEcheance },
      statut: { notIn: ["PAYE", "ANNULE"] },
    },
    orderBy: { dateEcheance: "desc" },
  });
  if (!precedente) return;

  const dateStr = new Date(precedente.dateEcheance).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  throw new AppError(`Veuillez d'abord payer l'échéance de ${dateStr}`, StatusCodes.BAD_REQUEST);
};

const syncTransactionLoyer = async (params: {
  proprietaireId: string;
  bienId: string;
  bailId: string;
  echeanceId: string;
  locataireId: string;
  dateEcheance?: Date | null;
  montant: number;
  statut: "EN_ATTENTE" | "CONFIRME";
  modePaiement?: string | null;
  provider?: string | null;
  reference?: string | null;
  note?: string | null;
  instructions?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  const existing = await prisma.transaction.findFirst({
    where: {
      proprietaireId: params.proprietaireId,
      echeanceId: params.echeanceId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "PAIEMENT_LOYER" as any,
    },
  });

  const mergedMetadata: Record<string, unknown> = {
    ...(existing?.metadata && typeof existing.metadata === "object"
      ? existing.metadata as Record<string, unknown>
      : {}),
    ...(params.metadata ?? {}),
  };

  const data = {
    proprietaireId: params.proprietaireId,
    bienId: params.bienId,
    bailId: params.bailId,
    echeanceId: params.echeanceId,
    locataireId: params.locataireId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: "PAIEMENT_LOYER" as any,
    statut: params.statut,
    montant: params.montant,
    devise: "XOF",
    modePaiement: params.modePaiement ?? existing?.modePaiement ?? "Paiement manuel",
    provider: params.provider ?? existing?.provider ?? null,
    reference: params.reference ?? existing?.reference ?? null,
    note: params.note ?? existing?.note ?? null,
    instructions: params.instructions ?? existing?.instructions ?? null,
    dateEcheance: params.dateEcheance ?? existing?.dateEcheance ?? null,
    dateConfirmation: params.statut === "CONFIRME" ? new Date() : null,
    // Prisma attend un type JSON d'entrée ici.
    metadata: mergedMetadata as any,
  };

  if (existing) {
    return prisma.transaction.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.transaction.create({ data });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Récupère l'ID du statut bien par son slug */
const getStatutId = async (slug: string): Promise<string> => {
  const statut = await BailRepo.getStatutBienBySlug(slug);
  if (!statut) throw new AppError(`Statut "${slug}" introuvable`, StatusCodes.INTERNAL_SERVER_ERROR);
  return statut.id;
};

/** Vérifie que le bien appartient au propriétaire */
const assertBienOwner = async (bienId: string, proprietaireId: string) => {
  const bien = await prisma.bien.findUnique({
    where: { id: bienId },
    select: { proprietaireId: true, typeTransaction: { select: { slug: true } } },
  });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId)
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  return bien;
};

// ─── Récupérer le bail actif d'un bien ───────────────────────────────────────

export const getBailActif = async (bienId: string, proprietaireId: string) => {
  await assertBienOwner(bienId, proprietaireId);
  return BailRepo.findActifByBien(bienId);
};

// ─── Historique des baux d'un bien ───────────────────────────────────────────

export const getHistoriqueBails = async (
  bienId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);
  return BailRepo.findByBien(bienId);
};

// ─── Créer un bail ────────────────────────────────────────────────────────────

export const creerBail = async (
  bienId: string,
  proprietaireId: string,
  data: {
    locataireId: string;
    typeBail?: string | null;
    dateDebutBail: Date;
    dateFinBail?: Date | null;
    renouvellement?: boolean;
    montantLoyer: number;
    montantCaution?: number | null;
    cautionVersee?: boolean;
    jourLimitePaiement?: number | null;
    delaiGrace?: number;
    frequencePaiement?: string | null;
  }
) => {
  const bien = await assertBienOwner(bienId, proprietaireId);

  // Vérifier qu'il n'y a pas déjà un bail ACTIF sur ce bien
  const existingBail = await BailRepo.findActifByBien(bienId);
  if (existingBail) {
    throw new AppError(
      "Ce bien a déjà un bail actif. Terminez-le avant d'en créer un nouveau.",
      StatusCodes.CONFLICT
    );
  }

  // Vérifier que le locataire appartient au propriétaire
  const locataire = await prisma.locataire.findUnique({
    where: { id: data.locataireId },
    select: { proprietaireId: true },
  });
  if (!locataire) throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  if (locataire.proprietaireId !== proprietaireId)
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  // Créer le bail (sera en EN_ATTENTE par défaut, activation lors de la validation du contrat)
  const bail = await BailRepo.create({
    bienId,
    locataireId: data.locataireId,
    proprietaireId,
    typeBail: data.typeBail,
    dateDebutBail: data.dateDebutBail,
    dateFinBail: data.dateFinBail,
    renouvellement: data.renouvellement ?? false,
    montantLoyer: data.montantLoyer,
    montantCaution: data.montantCaution,
    cautionVersee: data.cautionVersee ?? false,
    jourLimitePaiement: data.jourLimitePaiement,
    delaiGrace: data.delaiGrace ?? 5,
    frequencePaiement: data.frequencePaiement,
  });

  emitBailUpdated(proprietaireId, bienId);
  emitBienUpdated(proprietaireId, bienId);
  return bail;
};

// ─── Mettre un bail en préavis ────────────────────────────────────────────────

export const mettreEnPreavis = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if (bail.statut !== "ACTIF")
    throw new AppError("Le bail doit être actif pour passer en préavis", StatusCodes.BAD_REQUEST);

  // Calcul de la date de fin de préavis : now + 3 mois (ou si dateFinBail déjà définie et > 3 mois, on la conserve)
  const preavisDate = new Date();
  preavisDate.setMonth(preavisDate.getMonth() + 3);
  const dateFinBail = (!bail.dateFinBail || bail.dateFinBail < preavisDate)
    ? preavisDate
    : bail.dateFinBail;

  const updated = await prisma.bailLocation.update({
    where: { id: bailId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { statut: "EN_PREAVIS" as any, dateFinBail, initiePar: "PROPRIETAIRE" },
    include: {
      locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true } },
      bien: { select: { id: true, titre: true, ville: true } },
    },
  });

  const bienLabel = updated.bien?.titre || updated.bien?.ville || "votre logement";
  const finStr = dateFinBail.toLocaleDateString("fr-FR");
  await msgLocataire({
    userId: updated.locataireId, bailId, bienId, type: "PREAVIS",
    titre: "Préavis de fin de bail",
    corps: `Votre bailleur a déclenché un préavis pour ${bienLabel}. La date de fin de bail est fixée au ${finStr}.`,
  });

  // Notification SMS + email au locataire
  envoyerPreavisLocataire({
    locataireTelephone: updated.locataire.telephone,
    locataireEmail:     updated.locataire.email,
    locataireNom:       `${updated.locataire.prenom} ${updated.locataire.nom}`,
    bienTitre:          updated.bien?.titre,
    dateFinBail:        dateFinBail.toISOString(),
    bailId,
    bienId,
    proprietaireId:     updated.proprietaireId,
    locataireId:        updated.locataireId,
  }).catch((err) => console.error("[Bail] Erreur notif préavis locataire :", err));

  return updated;
};

// ─── Mettre un bail en préavis (côté locataire) ───────────────────────────────

export const mettreEnPreavisLocataire = async (
  locataireId: string,
  motif?: string
) => {
  // Trouver le bail actif du locataire
  const bail = await prisma.bailLocation.findFirst({
    where: { locataireId, statut: "ACTIF" },
  });
  if (!bail) throw new AppError("Aucun bail actif trouvé", StatusCodes.NOT_FOUND);

  // Calcul de la date de fin de préavis : now + 3 mois
  const preavisDate = new Date();
  preavisDate.setMonth(preavisDate.getMonth() + 3);
  const dateFinBail = (!bail.dateFinBail || bail.dateFinBail < preavisDate)
    ? preavisDate
    : bail.dateFinBail;

  const updatedLoc = await prisma.bailLocation.update({
    where: { id: bail.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { statut: "EN_PREAVIS" as any, dateFinBail, initiePar: "LOCATAIRE", motifResiliation: motif },
    include: {
      locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true } },
      bien: { select: { id: true, titre: true, ville: true } },
    },
  });

  const locNom = `${updatedLoc.locataire.prenom} ${updatedLoc.locataire.nom}`;
  const bienLabelLoc = updatedLoc.bien?.titre || updatedLoc.bien?.ville || "votre bien";
  const finStrLoc = dateFinBail.toLocaleDateString("fr-FR");
  await msgProprietaire({
    userId: updatedLoc.proprietaireId, bailId: updatedLoc.id, bienId: updatedLoc.bienId, type: "PREAVIS",
    titre: "Préavis donné par votre locataire",
    corps: `${locNom} a donné son préavis pour ${bienLabelLoc}. La date de fin de bail est fixée au ${finStrLoc}.`,
  });

  // Notification SMS + email au propriétaire
  prisma.proprietaire.findUnique({ where: { id: updatedLoc.proprietaireId }, select: { telephone: true, email: true } })
    .then((prop) => {
      if (!prop) return;
      return envoyerPreavisProprietaire({
        proprietaireTelephone: prop.telephone,
        proprietaireEmail:     prop.email,
        locataireNom:          locNom,
        bienTitre:             updatedLoc.bien?.titre,
        dateFinBail:           dateFinBail.toISOString(),
        bailId:                updatedLoc.id,
        bienId:                updatedLoc.bienId,
        proprietaireId:        updatedLoc.proprietaireId,
        locataireId,
      });
    })
    .catch((err) => console.error("[Bail] Erreur notif préavis propriétaire :", err));

  return updatedLoc;
};

// ─── Mettre un bail en renouvellement ────────────────────────────────────────

export const mettreEnRenouvellement = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if ((bail.statut as string) !== "EN_PREAVIS")
    throw new AppError("Le bail doit être en préavis pour passer en renouvellement", StatusCodes.BAD_REQUEST);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return BailRepo.updateStatut(bailId, "EN_RENOUVELLEMENT" as any);
};

// ─── Archiver un bail ─────────────────────────────────────────────────────────

export const archiverBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string,
  restitution?: { montantRestitue: number; motifRetenue?: string }
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if (bail.statut !== "TERMINE" && bail.statut !== "RESILIE")
    throw new AppError("Seul un bail terminé ou résilié peut être archivé", StatusCodes.BAD_REQUEST);

  // Restitution facultative de la caution : mêmes règles que restituerCaution, vérifiées
  // avant toute écriture, puis appliquée dans la même transaction que l'archivage.
  const depotUpdate = restitution ? await preparerRestitutionCaution(bailId, restitution) : null;

  const [updated] = await prisma.$transaction([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.bailLocation.update({ where: { id: bailId }, data: { statut: "ARCHIVE" as any }, include: BailRepo.BAIL_INCLUDE }),
    // Locataire → ANCIEN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.locataire.update({ where: { id: bail.locataireId }, data: { statut: "ANCIEN" as any } }),
    ...(depotUpdate ? [prisma.depotCaution.update(depotUpdate)] : []),
  ]);

  emitBailUpdated(proprietaireId, bienId);
  return updated;
};

// ─── Récupérer le bail à archiver d'un bien ──────────────────────────────────

export const getBailAArchiver = async (bienId: string, proprietaireId: string) => {
  await assertBienOwner(bienId, proprietaireId);
  return BailRepo.findAArchiverByBien(bienId);
};

// ─── Terminer un bail ─────────────────────────────────────────────────────────

export const terminerBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if (!["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"].includes(bail.statut as string))
    throw new AppError("Ce bail ne peut pas être terminé dans son état actuel", StatusCodes.BAD_REQUEST);

  const updatedTerm = await BailRepo.updateStatut(bailId, "TERMINE");

  // Remettre le bien à "Libre"
  const statutLibreId = await getStatutId("libre");
  await BailRepo.updateBienStatut(bienId, statutLibreId);

  // Notifier le locataire (message interne)
  await msgLocataire({
    userId: bail.locataireId, bailId, bienId, type: "FIN_BAIL",
    titre: "Fin de votre bail",
    corps: `Votre bail a été clôturé par votre bailleur. Merci pour votre séjour.`,
  });

  // Notification SMS + email au locataire
  prisma.locataire.findUnique({ where: { id: bail.locataireId }, select: { telephone: true, email: true, prenom: true, nom: true } })
    .then(async (loc) => {
      if (!loc) return;
      const bien = await prisma.bien.findUnique({ where: { id: bienId }, select: { titre: true } });
      return envoyerFinBailLocataire({
        locataireTelephone: loc.telephone,
        locataireEmail:     loc.email,
        locataireNom:       `${loc.prenom} ${loc.nom}`,
        bienTitre:          bien?.titre,
        bailId,
        bienId,
        proprietaireId,
        locataireId:        bail.locataireId,
      });
    })
    .catch((err) => console.error("[Bail] Erreur notif fin bail locataire :", err));

  emitBailUpdated(proprietaireId, bienId);
  emitBienUpdated(proprietaireId, bienId);
  return updatedTerm;
};

// ─── Résilier un bail ─────────────────────────────────────────────────────────

export const resilierBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string,
  motif?: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if (!["ACTIF", "EN_PREAVIS"].includes(bail.statut as string))
    throw new AppError("Ce bail ne peut pas être résilié dans son état actuel", StatusCodes.BAD_REQUEST);

  const updatedRes = await prisma.bailLocation.update({
    where: { id: bailId },
    data: { statut: "RESILIE", motifResiliation: motif, initiePar: "PROPRIETAIRE" },
    include: {
      locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true } },
      bien: { select: { id: true, titre: true, ville: true } },
    },
  });

  // Remettre le bien à "Libre"
  const statutLibreId = await getStatutId("libre");
  await BailRepo.updateBienStatut(bienId, statutLibreId);

  const bienLabelRes = updatedRes.bien?.titre || updatedRes.bien?.ville || "votre logement";
  const motifMsg = motif ? ` Motif : ${motif}.` : "";
  await msgLocataire({
    userId: updatedRes.locataireId, bailId, bienId, type: "RESILIATION",
    titre: "Résiliation de votre bail",
    corps: `Votre bailleur a résilié le bail pour ${bienLabelRes}.${motifMsg}`,
  });

  // Notification SMS + email au locataire
  envoyerResiliationLocataire({
    locataireTelephone: updatedRes.locataire.telephone,
    locataireEmail:     updatedRes.locataire.email,
    locataireNom:       `${updatedRes.locataire.prenom} ${updatedRes.locataire.nom}`,
    bienTitre:          updatedRes.bien?.titre,
    motif,
    bailId,
    bienId,
    proprietaireId,
    locataireId:        updatedRes.locataireId,
  }).catch((err) => console.error("[Bail] Erreur notif résiliation locataire :", err));

  emitBailUpdated(proprietaireId, bienId);
  emitBienUpdated(proprietaireId, bienId);
  return updatedRes;
};

// ─── Résilier un bail (côté locataire) ───────────────────────────────────────

export const resilierBailLocataire = async (
  locataireId: string,
  motif?: string
) => {
  const bail = await prisma.bailLocation.findFirst({
    where: { locataireId, statut: { in: ["ACTIF", "EN_PREAVIS"] } },
  });
  if (!bail) throw new AppError("Aucun bail actif ou en préavis trouvé", StatusCodes.NOT_FOUND);

  const updatedResLoc = await prisma.bailLocation.update({
    where: { id: bail.id },
    data: { statut: "RESILIE", motifResiliation: motif, initiePar: "LOCATAIRE" },
    include: {
      locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true } },
      bien: { select: { id: true, titre: true, ville: true } },
    },
  });

  // Remettre le bien à "Libre"
  const statutLibreId = await getStatutId("libre");
  await BailRepo.updateBienStatut(bail.bienId, statutLibreId);

  const locNomRes = `${updatedResLoc.locataire.prenom} ${updatedResLoc.locataire.nom}`;
  const bienLabelResLoc = updatedResLoc.bien?.titre || updatedResLoc.bien?.ville || "votre bien";
  const motifMsgLoc = motif ? ` Motif : ${motif}.` : "";
  await msgProprietaire({
    userId: updatedResLoc.proprietaireId, bailId: updatedResLoc.id, bienId: updatedResLoc.bienId, type: "RESILIATION",
    titre: "Résiliation par votre locataire",
    corps: `${locNomRes} a résilié le bail pour ${bienLabelResLoc}.${motifMsgLoc}`,
  });

  // Notification SMS + email au propriétaire
  prisma.proprietaire.findUnique({ where: { id: updatedResLoc.proprietaireId }, select: { telephone: true, email: true } })
    .then((prop) => {
      if (!prop) return;
      return envoyerResiliationProprietaire({
        proprietaireTelephone: prop.telephone,
        proprietaireEmail:     prop.email,
        locataireNom:          locNomRes,
        bienTitre:             updatedResLoc.bien?.titre,
        motif,
        bailId:                updatedResLoc.id,
        bienId:                updatedResLoc.bienId,
        proprietaireId:        updatedResLoc.proprietaireId,
        locataireId,
      });
    })
    .catch((err) => console.error("[Bail] Erreur notif résiliation propriétaire :", err));

  emitBailUpdated(updatedResLoc.proprietaireId, updatedResLoc.bienId);
  emitBienUpdated(updatedResLoc.proprietaireId, updatedResLoc.bienId);
  return updatedResLoc;
};

// ─── Annuler un bail (suppression + retour bien à "Libre") ───────────────────

export const annulerBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);

  // Supprimer le bail (contrat supprimé en cascade par Prisma)
  await BailRepo.remove(bailId);

  // Remettre le bien à "Libre"
  const statutLibreId = await getStatutId("libre");
  await BailRepo.updateBienStatut(bienId, statutLibreId);
};

// ─── Prolonger un bail ────────────────────────────────────────────────────────

export const prolongerBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string,
  duree: 6 | 12
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if (!["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"].includes(bail.statut as string))
    throw new AppError("Ce bail ne peut pas être prolongé dans son état actuel", StatusCodes.BAD_REQUEST);

  // Calcul de la nouvelle date de fin : à partir de l'actuelle ou d'aujourd'hui
  const baseDate = bail.dateFinBail ? new Date(bail.dateFinBail) : new Date();
  const dateFinBail = new Date(baseDate);
  dateFinBail.setMonth(dateFinBail.getMonth() + duree);

  // Si en préavis ou renouvellement, la prolongation remet le bail en ACTIF
  if ((bail.statut as string) === "EN_PREAVIS" || (bail.statut as string) === "EN_RENOUVELLEMENT") {
    return prisma.bailLocation.update({
      where: { id: bailId },
      data: { dateFinBail, statut: "ACTIF", renouvellement: true, initiePar: null },
      include: {
        locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true, nbOccupants: true, presenceEnfants: true } },
        bien: { select: { id: true, titre: true, ville: true, quartier: true, prix: true, caution: true, frequencePaiement: true, typeTransaction: { select: { slug: true } } } },
      },
    });
  }
  return BailRepo.prolonger(bailId, dateFinBail);
};

// ─── Échéancier ───────────────────────────────────────────────────────────────

export const getEcheancier = async (bienId: string, bailId: string, proprietaireId: string) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);

  const now = new Date();
  // A_VENIR → EN_ATTENTE quand la date est arrivée
  await prisma.echeancierLoyer.updateMany({
    where: { bailId, statut: "A_VENIR", dateEcheance: { lte: now } },
    data: { statut: "EN_ATTENTE" },
  });

  // EN_ATTENTE → EN_RETARD immédiatement après l'échéance (aucun délai de grâce)
  await prisma.echeancierLoyer.updateMany({
    where: { bailId, statut: "EN_ATTENTE", dateEcheance: { lt: now } },
    data: { statut: "EN_RETARD" },
  });

  // Renouvellement automatique : si bail actif et on est en novembre ou décembre,
  // générer l'échéancier de l'année prochaine s'il n'existe pas encore
  const isActiveForRenewal = ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"].includes(bail.statut as string);
  if (isActiveForRenewal && now.getMonth() >= 10) { // novembre = 10, décembre = 11
    const anneeActuelle = now.getFullYear();
    const anneeProchaine = anneeActuelle + 1;
    const dejaExistantes = await prisma.echeancierLoyer.count({
      where: {
        bailId,
        dateEcheance: {
          gte: new Date(anneeProchaine, 0, 1),
          lte: new Date(anneeProchaine, 11, 31),
        },
      },
    });
    if (dejaExistantes === 0) {
      // Trouver la dernière échéance de l'année actuelle
      const lastCurrentYear = await prisma.echeancierLoyer.findFirst({
        where: { bailId, dateEcheance: { lte: new Date(anneeActuelle, 11, 31) } },
        orderBy: { dateEcheance: "desc" },
      });
      if (lastCurrentYear) {
        const nextStart = advanceByFrequence(
          new Date(lastCurrentYear.dateEcheance),
          bail.frequencePaiement ?? "mensuel"
        );
        const prochaineAnneeFin = new Date(anneeProchaine, 11, 31);
        const stopDate =
          bail.dateFinBail && new Date(bail.dateFinBail) < prochaineAnneeFin
            ? new Date(bail.dateFinBail)
            : null;
        const echeances = genererEcheances({
          bailId, bienId, proprietaireId, locataireId: bail.locataireId,
          dateDebut: nextStart, dateFin: stopDate,
          frequence: bail.frequencePaiement ?? "mensuel",
          montant: bail.montantLoyer,
          dateMax: stopDate ? undefined : prochaineAnneeFin,
        });
        if (echeances.length > 0) {
          await prisma.echeancierLoyer.createMany({ data: echeances });
        }
      }
    }
  }

  return prisma.echeancierLoyer.findMany({
    where: { bailId },
    orderBy: { dateEcheance: "asc" },
  });
};

export const payerEcheance = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  proprietaireId: string,
  data: { datePaiement: Date; modePaiement?: string; reference?: string; note?: string }
) => {
  await assertBienOwner(bienId, proprietaireId);
  const echeance = await prisma.echeancierLoyer.findUnique({ where: { id: echeanceId } });
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.bailId !== bailId) throw new AppError("Échéance non associée à ce bail", StatusCodes.BAD_REQUEST);
  if (echeance.statut === "PAYE" || echeance.statut === "ANNULE" || echeance.statut === "EN_ATTENTE_CONFIRMATION")
    throw new AppError("Cette échéance est déjà soldée ou annulée", StatusCodes.BAD_REQUEST);

  // Vérifier la séquentialité : aucune échéance antérieure ne doit être impayée
  await ensurePreviousUnpaidCleared(bailId, echeance.dateEcheance);

  // Commission
  const config = await getConfig();
  let commissionTaux: number | null = null;
  let commissionMontant: number | null = null;
  let montantNet: number | null = null;
  if (config.commissionActive && config.tauxCommission > 0) {
    commissionTaux = config.tauxCommission;
    commissionMontant = Math.round(echeance.montant * commissionTaux / 100);
    montantNet = echeance.montant - commissionMontant;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma.echeancierLoyer.update as any)({
    where: { id: echeanceId },
    data: {
      statut: "PAYE",
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement,
      reference: data.reference,
      note: data.note,
      sourceEnregistrement: "PROPRIETAIRE",
      ...(commissionTaux !== null && {
        commissionTaux,
        commissionMontant,
        montantNet,
      }),
    },
  });

  await syncTransactionLoyer({
    proprietaireId,
    bienId,
    bailId,
    echeanceId,
    locataireId: echeance.locataireId,
    dateEcheance: echeance.dateEcheance,
    montant: echeance.montant,
    statut: "CONFIRME",
    modePaiement: data.modePaiement,
    provider: data.modePaiement,
    reference: data.reference,
    note: data.note,
    metadata: {
      sourceEnregistrement: "PROPRIETAIRE",
    },
  });

  // Créer la transaction COMMISSION_LOYER si commission active
  if (commissionMontant && commissionMontant > 0) {
    const bail = await prisma.bailLocation.findUnique({ where: { id: bailId } });
    if (bail) {
      await prisma.transaction.create({
        data: {
          proprietaireId: bail.proprietaireId,
          bienId: bail.bienId,
          bailId,
          echeanceId,
          locataireId: bail.locataireId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: "COMMISSION_LOYER" as any,
          statut: "CONFIRME",
          montant: commissionMontant,
          modePaiement: data.modePaiement ?? "Mobile Money",
          reference: data.reference,
          note: `Commission ${commissionTaux}% sur loyer`,
          dateConfirmation: new Date(),
          metadata: {
            echeanceId,
            tauxCommission: commissionTaux,
            montantLoyer: echeance.montant,
            montantNet,
          },
        },
      });
    }
  }

  // Push temps réel : statut de paiement + badge owner
  emitTransactionStatus({
    transactionId: echeanceId,
    proprietaireId,
    statut: "CONFIRME",
    montant: echeance.montant,
    type: "PAIEMENT_LOYER",
    bienId,
    updatedAt: new Date().toISOString(),
  });
  emitBadgeUpdate(proprietaireId).catch(() => null);
  fetchAndEmitStatsGlobales().catch(() => null);

  // Auto-génération quittance
  genererQuittanceInterne(echeanceId).catch(() => null);

  // Notification de confirmation au locataire (fire-and-forget)
  prisma.bailLocation.findUnique({
    where: { id: bailId },
    include: {
      locataire: { select: { telephone: true, nom: true, prenom: true } },
      bien: { select: { titre: true } },
    },
  }).then(bail => {
    if (!bail?.locataire?.telephone) return;
    envoyerConfirmationPaiement({
      locataireTelephone: bail.locataire.telephone,
      locataireNom: `${bail.locataire.prenom} ${bail.locataire.nom}`,
      montant: echeance.montant,
      datePaiement: data.datePaiement.toISOString(),
      reference: data.reference,
      bienTitre: bail.bien?.titre,
      echeanceId,
      bailId,
      bienId,
      proprietaireId,
      locataireId: bail.locataireId,
    }).catch(() => null);
  }).catch(() => null);

  return updated;
};

export const payerMoisMultiples = async (
  bienId: string,
  bailId: string,
  proprietaireId: string,
  data: { datePaiement: Date; nombreMois: number; modePaiement?: string; reference?: string; note?: string }
) => {
  await assertBienOwner(bienId, proprietaireId);
  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId) throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);

  // Récupérer les N prochaines échéances non payées dans l'ordre chronologique
  const unpaid = await prisma.echeancierLoyer.findMany({
    where: { bailId, statut: { notIn: ["PAYE", "ANNULE"] } },
    orderBy: { dateEcheance: "asc" },
    take: data.nombreMois,
  });

  if (unpaid.length === 0) throw new AppError("Aucune échéance à payer", StatusCodes.BAD_REQUEST);
  await ensurePreviousUnpaidCleared(bailId, unpaid[0]!.dateEcheance);

  const ids = unpaid.map(e => e.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.echeancierLoyer.updateMany as any)({
    where: { id: { in: ids } },
    data: {
      statut: "PAYE",
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement,
      reference: data.reference,
      note: data.note,
      sourceEnregistrement: "PROPRIETAIRE",
    },
  });

  await Promise.all(
    unpaid.map((item) =>
      syncTransactionLoyer({
        proprietaireId,
        bienId,
        bailId,
        echeanceId: item.id,
        locataireId: item.locataireId,
        dateEcheance: item.dateEcheance,
        montant: item.montant,
        statut: "CONFIRME",
        modePaiement: data.modePaiement,
        provider: data.modePaiement,
        reference: data.reference,
        note: data.note,
        metadata: {
          sourceEnregistrement: "PROPRIETAIRE",
        },
      })
    )
  );

  // Auto-génération quittances pour chaque échéance (fire-and-forget)
  for (const id of ids) {
    genererQuittanceInterne(id).catch(() => null);
  }

  return { paye: unpaid.length, ids };
};

// ─── Paiement par le locataire (enregistrement direct) ───────────────────────

export const payerEcheancesLocataire = async (
  locataireId: string,
  data: {
    nombreMois: number;
    datePaiement: Date;
    modePaiement: string;
    reference?: string;
    note?: string;
  }
) => {
  // Récupérer le bail actif du locataire
  const bail = await prisma.bailLocation.findFirst({
    where: { locataireId, statut: "ACTIF" },
  });
  if (!bail) throw new AppError("Aucun bail actif trouvé", StatusCodes.BAD_REQUEST);

  // Récupérer les N premières échéances non payées dans l'ordre chronologique
  const unpaid = await prisma.echeancierLoyer.findMany({
    where: { bailId: bail.id, statut: { notIn: ["PAYE", "ANNULE"] } },
    orderBy: { dateEcheance: "asc" },
    take: data.nombreMois,
  });

  if (unpaid.length === 0)
    throw new AppError("Aucune échéance à payer", StatusCodes.BAD_REQUEST);

  const ids = unpaid.map(e => e.id);
  const montantTotal = unpaid.reduce((sum, e) => sum + e.montant, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.echeancierLoyer.updateMany as any)({
    where: { id: { in: ids } },
    data: {
      statut: "EN_ATTENTE_CONFIRMATION",
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement,
      reference: data.reference ?? null,
      note: data.note ?? null,
      sourceEnregistrement: "LOCATAIRE",
    },
  });

  await Promise.all(
    unpaid.map((item) =>
      syncTransactionLoyer({
        proprietaireId: bail.proprietaireId,
        bienId: bail.bienId,
        bailId: bail.id,
        echeanceId: item.id,
        locataireId,
        dateEcheance: item.dateEcheance,
        montant: item.montant,
        statut: "EN_ATTENTE",
        modePaiement: data.modePaiement,
        provider: data.modePaiement,
        reference: data.reference ?? null,
        note: data.note ?? null,
        metadata: {
          sourceEnregistrement: "LOCATAIRE",
        },
      })
    )
  );

  // Notification au propriétaire — paiement en attente de confirmation (fire-and-forget)
  prisma.bailLocation.findUnique({
    where: { id: bail.id },
    include: {
      locataire: { select: { telephone: true, nom: true, prenom: true } },
      proprietaire: { select: { telephone: true } },
      bien: { select: { titre: true } },
    },
  }).then(bailFull => {
    if (!bailFull?.proprietaire?.telephone) return;
    const locataireNom = bailFull.locataire
      ? `${bailFull.locataire.prenom} ${bailFull.locataire.nom}`
      : "Locataire";
    envoyerPaiementLocataire({
      proprietaireTelephone: bailFull.proprietaire.telephone,
      locataireNom,
      montant: montantTotal,
      datePaiement: data.datePaiement.toISOString(),
      reference: data.reference,
      bienTitre: bailFull.bien?.titre,
      nombreMois: data.nombreMois,
      echeanceId: ids[0],
      bailId: bail.id,
      bienId: bail.bienId,
      proprietaireId: bail.proprietaireId,
      locataireId,
    }).catch(() => null);
  }).catch(() => null);

  return { paye: unpaid.length, ids };
};

// ─── Confirmation de réception (propriétaire) ─────────────────────────────────

/**
 * Le propriétaire confirme qu'il a bien reçu le paiement enregistré par le locataire.
 * Applicable aux échéances EN_ATTENTE_CONFIRMATION (sourceEnregistrement = "LOCATAIRE")
 * ou déjà PAYE par le locataire (rétro-compat).
 */
export const confirmerReceptionPaiement = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const echeance = await prisma.echeancierLoyer.findUnique({ where: { id: echeanceId } });
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.bailId !== bailId) throw new AppError("Échéance non associée à ce bail", StatusCodes.BAD_REQUEST);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statut = echeance.statut as any;
  if (statut !== "PAYE" && statut !== "EN_ATTENTE_CONFIRMATION")
    throw new AppError("Impossible de confirmer cette échéance", StatusCodes.BAD_REQUEST);
  if (statut === "EN_ATTENTE_CONFIRMATION" && echeance.sourceEnregistrement !== "LOCATAIRE")
    throw new AppError("Ce paiement doit être confirmé par le locataire", StatusCodes.BAD_REQUEST);
  if (echeance.confirmeParProprietaire)
    throw new AppError("Paiement déjà confirmé", StatusCodes.BAD_REQUEST);

  const needsValidation = statut === "EN_ATTENTE_CONFIRMATION";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma.echeancierLoyer.update as any)({
    where: { id: echeanceId },
    data: {
      ...(needsValidation && { statut: "PAYE" }),
      confirmeParProprietaire: true,
      dateConfirmation: new Date(),
    },
  });

  await syncTransactionLoyer({
    proprietaireId,
    bienId,
    bailId,
    echeanceId,
    locataireId: echeance.locataireId,
    dateEcheance: echeance.dateEcheance,
    montant: echeance.montant,
    statut: "CONFIRME",
    modePaiement: echeance.modePaiement,
    provider: echeance.modePaiement,
    reference: echeance.reference,
    note: echeance.note,
    metadata: {
      sourceEnregistrement: echeance.sourceEnregistrement ?? "LOCATAIRE",
      confirmeParProprietaire: true,
    },
  });

  // Si l'échéance vient de passer à PAYE, générer la quittance
  if (needsValidation) {
    genererQuittanceInterne(echeanceId).catch(() => null);
  }

  // Notification au locataire après validation par le propriétaire (fire-and-forget)
  prisma.bailLocation.findUnique({
    where: { id: bailId },
    include: {
      locataire: { select: { telephone: true, email: true, nom: true, prenom: true } },
      proprietaire: { select: { nom: true, prenom: true } },
      bien: { select: { titre: true } },
    },
  }).then(bailFull => {
    if (!bailFull?.locataire?.telephone) return;
    const proprietaireLabel = bailFull.proprietaire
      ? `Votre propriétaire ${bailFull.proprietaire.prenom} ${bailFull.proprietaire.nom}`
      : "Votre propriétaire";
    envoyerConfirmationPaiementProprietaire({
      locataireTelephone: bailFull.locataire.telephone,
      locataireEmail: bailFull.locataire.email,
      proprietaireLabel,
      montant: echeance.montant,
      datePaiement: (echeance.datePaiement ?? new Date()).toISOString(),
      modePaiement: echeance.modePaiement,
      bienTitre: bailFull.bien?.titre,
      echeanceId,
      bailId,
      bienId,
      proprietaireId,
      locataireId: echeance.locataireId,
    }).catch(() => null);
  }).catch(() => null);

  return updated;
};

// ─── Paiement espèces (propriétaire enregistre, locataire confirme) ───────────

/**
 * Le propriétaire enregistre un paiement reçu en espèces hors plateforme.
 * L'échéance passe en EN_ATTENTE_CONFIRMATION, le locataire reçoit une notification.
 */
export const enregistrerPaiementEspeces = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  proprietaireId: string,
  data: { datePaiement: Date; note?: string; nombreMois?: number }
) => {
  await assertBienOwner(bienId, proprietaireId);

  const echeance = await prisma.echeancierLoyer.findUnique({ where: { id: echeanceId } });
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.bailId !== bailId) throw new AppError("Échéance non associée à ce bail", StatusCodes.BAD_REQUEST);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((["PAYE", "ANNULE", "EN_ATTENTE_CONFIRMATION"] as any[]).includes(echeance.statut))
    throw new AppError("Cette échéance n'est pas éligible à un enregistrement espèces", StatusCodes.BAD_REQUEST);
  await ensurePreviousUnpaidCleared(bailId, echeance.dateEcheance);

  const nombreMois = Math.max(1, data.nombreMois ?? 1);
  const echeances = await prisma.echeancierLoyer.findMany({
    where: {
      bailId,
      statut: { notIn: ["PAYE", "ANNULE", "EN_ATTENTE_CONFIRMATION"] },
      dateEcheance: { gte: echeance.dateEcheance },
    },
    orderBy: { dateEcheance: "asc" },
    take: nombreMois,
  });
  if (echeances.length === 0) {
    throw new AppError("Aucune échéance éligible à un enregistrement espèces", StatusCodes.BAD_REQUEST);
  }
  if (echeances[0]?.id !== echeanceId) {
    throw new AppError("Veuillez commencer par la première échéance impayée", StatusCodes.BAD_REQUEST);
  }
  const ids = echeances.map((item) => item.id);
  const montantTotal = echeances.reduce((sum, item) => sum + item.montant, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.echeancierLoyer.updateMany as any)({
    where: { id: { in: ids } },
    data: {
      statut: "EN_ATTENTE_CONFIRMATION",
      datePaiement: data.datePaiement,
      modePaiement: "Espèces",
      note: data.note ?? null,
      sourceEnregistrement: "PROPRIETAIRE",
    },
  });

  await Promise.all(
    echeances.map((item) =>
      syncTransactionLoyer({
        proprietaireId,
        bienId,
        bailId,
        echeanceId: item.id,
        locataireId: item.locataireId,
        dateEcheance: item.dateEcheance,
        montant: item.montant,
        statut: "EN_ATTENTE",
        modePaiement: "Espèces",
        provider: "Espèces",
        note: data.note ?? null,
        metadata: {
          sourceEnregistrement: "PROPRIETAIRE",
        },
      })
    )
  );

  // Notification locataire (fire-and-forget)
  prisma.bailLocation.findUnique({
    where: { id: bailId },
    include: {
      locataire: { select: { telephone: true, email: true, nom: true, prenom: true } },
      bien: { select: { titre: true } },
    },
  }).then(bailFull => {
    if (!bailFull?.locataire?.telephone) return;
    envoyerPaiementEspecesLocataire({
      locataireTelephone: bailFull.locataire.telephone,
      locataireEmail: bailFull.locataire.email,
      locataireNom: `${bailFull.locataire.prenom} ${bailFull.locataire.nom}`,
      montant: montantTotal,
      datePaiement: data.datePaiement.toISOString(),
      bienTitre: bailFull.bien?.titre,
      echeanceId,
      bailId,
      bienId,
      proprietaireId,
      locataireId: echeance.locataireId,
      nombreMois: echeances.length,
    }).catch(() => null);

    // Message interne au locataire
    msgLocataire({
      userId: echeance.locataireId, bailId, bienId,
      type: "PAIEMENT_ESPECES",
      titre: "Paiement espèces à confirmer",
      corps: `Votre propriétaire a enregistré un paiement en espèces de ${montantTotal.toLocaleString("fr-FR")} FCFA${echeances.length > 1 ? ` pour ${echeances.length} mois` : ""}. Veuillez confirmer ce paiement.`,
    }).catch(() => null);
  }).catch(() => null);

  return prisma.echeancierLoyer.findUnique({ where: { id: echeanceId } });
};

/**
 * Le locataire confirme le paiement espèces enregistré par le propriétaire.
 * L'échéance passe en PAYE, quittance générée, notifications envoyées.
 */
export const confirmerPaiementEspacesLocataire = async (
  locataireId: string,
  echeanceId: string
) => {
  const echeance = await prisma.echeancierLoyer.findUnique({ where: { id: echeanceId } });
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.locataireId !== locataireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((echeance.statut as any) !== "EN_ATTENTE_CONFIRMATION")
    throw new AppError("Ce paiement n'est pas en attente de confirmation", StatusCodes.BAD_REQUEST);
  if (echeance.sourceEnregistrement !== "PROPRIETAIRE")
    throw new AppError("Ce paiement doit être confirmé par le propriétaire", StatusCodes.BAD_REQUEST);
  if (echeance.confirmeParLocataire)
    throw new AppError("Paiement déjà confirmé", StatusCodes.BAD_REQUEST);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma.echeancierLoyer.update as any)({
    where: { id: echeanceId },
    data: {
      statut: "PAYE",
      confirmeParLocataire: true,
      dateConfirmationLocataire: new Date(),
    },
  });

  await syncTransactionLoyer({
    proprietaireId: echeance.proprietaireId,
    bienId: echeance.bienId,
    bailId: echeance.bailId,
    echeanceId,
    locataireId,
    dateEcheance: echeance.dateEcheance,
    montant: echeance.montant,
    statut: "CONFIRME",
    modePaiement: echeance.modePaiement,
    provider: echeance.modePaiement,
    reference: echeance.reference,
    note: echeance.note,
    metadata: {
      sourceEnregistrement: "PROPRIETAIRE",
      confirmeParLocataire: true,
    },
  });

  // Quittance (fire-and-forget)
  genererQuittanceInterne(echeanceId).catch(() => null);

  // Notifications (fire-and-forget)
  prisma.bailLocation.findUnique({
    where: { id: echeance.bailId },
    include: {
      locataire: { select: { telephone: true, email: true, nom: true, prenom: true } },
      proprietaire: { select: { telephone: true, email: true } },
      bien: { select: { titre: true } },
    },
  }).then(bailFull => {
    if (!bailFull) return;
    const locataireNom = `${bailFull.locataire.prenom} ${bailFull.locataire.nom}`;
    const datePaiement = (echeance.datePaiement ?? new Date()).toISOString();

    // Notif propriétaire
    if (bailFull.proprietaire?.telephone) {
      envoyerConfirmationEspecesProprietaire({
        proprietaireTelephone: bailFull.proprietaire.telephone,
        proprietaireEmail: bailFull.proprietaire.email,
        locataireNom,
        montant: echeance.montant,
        datePaiement,
        bienTitre: bailFull.bien?.titre,
        echeanceId,
        bailId: echeance.bailId,
        bienId: echeance.bienId,
        proprietaireId: echeance.proprietaireId,
        locataireId,
      }).catch(() => null);

      // Message interne au propriétaire
      msgProprietaire({
        userId: echeance.proprietaireId, bailId: echeance.bailId, bienId: echeance.bienId,
        type: "CONFIRMATION_ESPECES",
        titre: "Paiement espèces confirmé",
        corps: `${locataireNom} a confirmé son paiement en espèces de ${echeance.montant.toLocaleString("fr-FR")} FCFA.`,
      }).catch(() => null);
    }

    // Notif locataire (confirmation)
    if (bailFull.locataire?.telephone) {
      envoyerConfirmationPaiement({
        locataireTelephone: bailFull.locataire.telephone,
        locataireEmail: bailFull.locataire.email,
        locataireNom,
        montant: echeance.montant,
        datePaiement,
        bienTitre: bailFull.bien?.titre,
        echeanceId,
        bailId: echeance.bailId,
        bienId: echeance.bienId,
        proprietaireId: echeance.proprietaireId,
        locataireId,
      }).catch(() => null);
    }
  }).catch(() => null);

  return updated;
};

// ─── Caution ──────────────────────────────────────────────────────────────────

export const getCaution = async (bienId: string, bailId: string, proprietaireId: string) => {
  await assertBienOwner(bienId, proprietaireId);
  return prisma.depotCaution.findUnique({ where: { bailId } });
};

// Vérifie qu'une restitution de caution est permise et renvoie la mise à jour à appliquer.
const preparerRestitutionCaution = async (
  bailId: string,
  data: { montantRestitue: number; motifRetenue?: string; dateRestitution?: Date }
) => {
  const depot = await prisma.depotCaution.findUnique({ where: { bailId } });
  if (!depot) throw new AppError("Dépôt de caution introuvable", StatusCodes.NOT_FOUND);
  if (data.montantRestitue > depot.montant)
    throw new AppError("Le montant restitué ne peut pas dépasser la caution reçue.", StatusCodes.BAD_REQUEST);

  const [edlEntree, edlSortie] = await Promise.all([
    prisma.etatDesLieux.findUnique({
      where: { bailId_type: { bailId, type: "ENTREE" as any } },
      select: { id: true, statut: true },
    }),
    prisma.etatDesLieux.findUnique({
      where: { bailId_type: { bailId, type: "SORTIE" as any } },
      select: { id: true, statut: true },
    }),
  ]);
  if (!edlEntree || edlEntree.statut !== "VALIDE" || !edlSortie || edlSortie.statut !== "VALIDE") {
    throw new AppError(
      "La caution ne peut être restituée qu'après des états des lieux d'entrée et de sortie validés.",
      StatusCodes.BAD_REQUEST
    );
  }

  const statut = data.montantRestitue >= depot.montant
    ? "RESTITUE"
    : data.montantRestitue > 0
    ? "PARTIELLEMENT_RESTITUE"
    : "RETENU";

  return {
    where: { bailId },
    data: {
      statut,
      montantRestitue: data.montantRestitue,
      motifRetenue: data.motifRetenue,
      dateRestitution: data.dateRestitution ?? new Date(),
    },
  } as const;
};

export const restituerCaution = async (
  bienId: string,
  bailId: string,
  proprietaireId: string,
  data: { montantRestitue: number; motifRetenue?: string; dateRestitution?: Date }
) => {
  await assertBienOwner(bienId, proprietaireId);
  return prisma.depotCaution.update(await preparerRestitutionCaution(bailId, data));
};

// ─── Mobile Money ─────────────────────────────────────────────────────────────

const MOBILE_MONEY_PAR_PAYS: Record<string, { nom: string; instructions: string }[]> = {
  "Sénégal": [
    { nom: "Orange Money", instructions: "Composez *144# pour accéder au service Orange Money Sénégal." },
    { nom: "Wave",         instructions: "Utilisez l'application Wave pour effectuer le virement." },
  ],
};

const DEFAULT_MOBILE_MONEY = [
  {
    nom: "Mobile Money",
    instructions:
      "Contactez le propriétaire pour obtenir ses coordonnées de paiement Mobile Money.",
  },
];

export const getMobileMoney = async (bienId: string, proprietaireId: string) => {
  await assertBienOwner(bienId, proprietaireId);
  const bien = await prisma.bien.findUnique({
    where: { id: bienId },
    select: { pays: true },
  });
  const pays = bien?.pays ?? null;
  const providers = pays
    ? (MOBILE_MONEY_PAR_PAYS[pays] ?? DEFAULT_MOBILE_MONEY)
    : DEFAULT_MOBILE_MONEY;
  return { pays, providers };
};

// ─── Solde locataire ──────────────────────────────────────────────────────────

export const getSolde = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);

  const echeances = await prisma.echeancierLoyer.findMany({
    where: { bailId },
    orderBy: { dateEcheance: "asc" },
  });

  let montantTotalDu = 0;
  let montantPaye = 0;
  let montantEnRetard = 0;
  let nbPaye = 0;
  let nbEnRetard = 0;
  let nbEnAttente = 0;
  let nbAVenir = 0;

  for (const e of echeances) {
    montantTotalDu += e.montant;
    if (e.statut === "PAYE") {
      montantPaye += e.montant;
      nbPaye++;
    } else if (e.statut === "EN_RETARD") {
      montantEnRetard += e.montant;
      nbEnRetard++;
    } else if (e.statut === "EN_ATTENTE") {
      nbEnAttente++;
    } else if (e.statut === "A_VENIR") {
      nbAVenir++;
    }
  }

  return {
    totalEcheances: echeances.length,
    nbPaye,
    nbEnRetard,
    nbEnAttente,
    nbAVenir,
    montantTotalDu,
    montantPaye,
    montantEnRetard,
    solde: montantTotalDu - montantPaye,
  };
};

// ─── Prolonger l'échéancier d'une année ──────────────────────────────────────

export const prolongerEcheancesAnnee = async (
  bienId: string,
  bailId: string,
  proprietaireId: string,
  anneeActuelle: number
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if (!["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"].includes(bail.statut as string))
    throw new AppError("Le bail doit être actif pour renouveler les paiements", StatusCodes.BAD_REQUEST);

  const anneeProchaine = anneeActuelle + 1;
  const prochaineAnneeDebut = new Date(anneeProchaine, 0, 1);
  const prochaineAnneeFin  = new Date(anneeProchaine, 11, 31);

  // Si des échéances pour l'année prochaine existent déjà (vieux bail), on les retourne
  const dejaExistantes = await prisma.echeancierLoyer.count({
    where: {
      bailId,
      dateEcheance: { gte: prochaineAnneeDebut, lte: prochaineAnneeFin },
    },
  });
  if (dejaExistantes > 0) {
    return { generated: 0, annee: anneeProchaine, existed: dejaExistantes };
  }

  // Trouver la dernière échéance de l'année actuelle pour calculer le prochain départ
  const lastCurrentYear = await prisma.echeancierLoyer.findFirst({
    where: {
      bailId,
      dateEcheance: { lte: new Date(anneeActuelle, 11, 31) },
    },
    orderBy: { dateEcheance: "desc" },
  });
  if (!lastCurrentYear)
    throw new AppError("Aucune échéance trouvée pour l'année en cours", StatusCodes.BAD_REQUEST);

  // La prochaine période commence juste après la dernière de l'année actuelle
  const nextStart = advanceByFrequence(
    new Date(lastCurrentYear.dateEcheance),
    bail.frequencePaiement ?? "mensuel"
  );

  // Respecter la date de fin du bail si elle est plus tôt que le 31/12 de l'année prochaine
  const stopDate =
    bail.dateFinBail && new Date(bail.dateFinBail) < prochaineAnneeFin
      ? new Date(bail.dateFinBail)
      : null;

  const echeances = genererEcheances({
    bailId, bienId, proprietaireId, locataireId: bail.locataireId,
    dateDebut: nextStart, dateFin: stopDate,
    frequence: bail.frequencePaiement ?? "mensuel",
    montant: bail.montantLoyer,
    dateMax: stopDate ? undefined : prochaineAnneeFin,
  });

  if (echeances.length === 0)
    throw new AppError("Aucune nouvelle échéance à générer pour cette période", StatusCodes.BAD_REQUEST);

  await prisma.echeancierLoyer.createMany({ data: echeances });
  return { generated: echeances.length, annee: anneeProchaine };
};

// ─── Activer un bail (après validation du contrat) ──────────────────────────

export const activerBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);

  const bail = await BailRepo.findById(bailId);
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  if ((bail.statut as string) !== "EN_ATTENTE")
    throw new AppError("Seul un bail en attente peut être activé", StatusCodes.BAD_REQUEST);

  // Activer le bail
  const bailActif = await BailRepo.updateStatut(bailId, "ACTIF");

  // 1. Bien → statut "Loué"
  const statutLoueId = await getStatutId("loue");
  await BailRepo.updateBienStatut(bienId, statutLoueId);

  // 2. NOTE: Le locataire reste en statut INVITE jusqu'à ce qu'il active son compte
  // Le changement de statut vers ACTIF se fait lors de l'activation du compte locataire
  // (voir locataireAuth.service.ts - fonction activer())

  // 3. Génération de l'échéancier de loyers (limité au 31/12 de l'année en cours)
  const now = new Date();
  const dateMax = new Date(now.getFullYear(), 11, 31);
  const echeances = genererEcheances({
    bailId, bienId, proprietaireId, locataireId: bail.locataireId,
    dateDebut: bail.dateDebutBail, dateFin: bail.dateFinBail ?? null,
    frequence: bail.frequencePaiement ?? "mensuel",
    montant: bail.montantLoyer,
    dateMax,
  });
  if (echeances.length > 0) {
    await prisma.echeancierLoyer.createMany({ data: echeances });
  }

  // 4. Création du dépôt de caution
  if (bail.montantCaution && bail.montantCaution > 0) {
    await prisma.depotCaution.create({
      data: {
        bailId,
        bienId,
        proprietaireId,
        locataireId: bail.locataireId,
        montant: bail.montantCaution,
      },
    });
  }

  return bailActif;
};

// ─── Échéancier (vue locataire) ───────────────────────────────────────────────

export const getEcheancierForLocataire = async (locataireId: string) => {
  const bail = await prisma.bailLocation.findFirst({
    where: { locataireId, statut: "ACTIF" },
  });
  if (!bail) return [];

  const now = new Date();
  await prisma.echeancierLoyer.updateMany({
    where: { bailId: bail.id, statut: "A_VENIR", dateEcheance: { lte: now } },
    data: { statut: "EN_ATTENTE" },
  });
  await prisma.echeancierLoyer.updateMany({
    where: { bailId: bail.id, statut: "EN_ATTENTE", dateEcheance: { lt: now } },
    data: { statut: "EN_RETARD" },
  });

  return prisma.echeancierLoyer.findMany({
    where: { bailId: bail.id },
    orderBy: { dateEcheance: "asc" },
  });
};

// ─── Contrat (vue locataire) ───────────────────────────────────────────────

export const getContratForLocataire = async (locataireId: string) => {
  // Récupérer le bail actif du locataire
  const bail = await prisma.bailLocation.findFirst({
    where: { locataireId, statut: "ACTIF" },
    include: {
      bien: {
        select: {
          id: true,
          titre: true,
          adresse: true,
          quartier: true,
          ville: true,
          region: true,
        },
      },
      locataire: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    },
  });

  if (!bail) return null;

  // Récupérer le contrat associé au bail
  const contrat = await prisma.contrat.findUnique({
    where: { bailId: bail.id },
    include: {
      modele: {
        select: { id: true, titre: true, typeBail: true },
      },
    },
  });

  if (!contrat) return null;

  return {
    bail: {
      id: bail.id,
      typeBail: bail.typeBail,
      dateDebutBail: bail.dateDebutBail,
      dateFinBail: bail.dateFinBail,
      montantLoyer: bail.montantLoyer,
      montantCaution: bail.montantCaution,
      cautionVersee: bail.cautionVersee,
      jourLimitePaiement: bail.jourLimitePaiement,
      frequencePaiement: bail.frequencePaiement,
    },
    bien: bail.bien,
    contrat: {
      id: contrat.id,
      titre: contrat.titre,
      contenu: contrat.contenu,
      statut: contrat.statut,
      createdAt: contrat.createdAt,
      updatedAt: contrat.updatedAt,
      modele: contrat.modele,
    },
  };
};

// ─── Infos propriétaire (vue locataire) ───────────────────────────────────────

export const getProprietaireForLocataire = async (locataireId: string) => {
  // Récupérer le bail actif du locataire
  const bail = await prisma.bailLocation.findFirst({
    where: { locataireId, statut: "ACTIF" },
    include: {
      bien: {
        select: {
          id: true,
          titre: true,
          adresse: true,
          quartier: true,
          ville: true,
          region: true,
          pays: true,
        },
      },
      proprietaire: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          telephone: true,
          email: true,
        },
      },
    },
  });

  if (!bail) return null;

  return {
    bien: bail.bien,
    proprietaire: bail.proprietaire,
  };
};

// ─── Biens avec bail actif (owner) ───────────────────────────────────────────

export const getBiensAvecBailActif = async (proprietaireId: string) => {
  const bails = await prisma.bailLocation.findMany({
    where: {
      proprietaireId,
      statut: { in: ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"] },
    },
    include: {
      bien: {
        select: {
          id: true, titre: true, adresse: true, ville: true, pays: true,
          typeTransaction: { select: { slug: true, nom: true } },
        },
      },
      locataire: {
        select: { id: true, nom: true, prenom: true, telephone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return bails.map(b => ({
    bailId: b.id,
    bienId: b.bienId,
    bienTitre: b.bien?.titre ?? null,
    bienVille: b.bien?.ville ?? null,
    locataireId: b.locataireId,
    locataireNom: b.locataire ? `${b.locataire.prenom} ${b.locataire.nom}` : null,
    locataireTelephone: b.locataire?.telephone ?? null,
    montantLoyer: b.montantLoyer,
    statutBail: b.statut,
  }));
};

// ─── Biens avec loyers en retard (owner) ─────────────────────────────────────

export const getBiensEnRetard = async (proprietaireId: string) => {
  const now = new Date();

  // Mettre à jour les statuts EN_ATTENTE → EN_RETARD pour tous les baux de ce proprio
  await prisma.echeancierLoyer.updateMany({
    where: {
      proprietaireId,
      statut: "EN_ATTENTE",
      dateEcheance: { lt: now },
    },
    data: { statut: "EN_RETARD" },
  });

  // Récupérer les baux actifs avec au moins une échéance EN_RETARD
  const bails = await prisma.bailLocation.findMany({
    where: {
      proprietaireId,
      statut: { in: ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"] },
      echeancier: { some: { statut: "EN_RETARD" } },
    },
    include: {
      bien: {
        select: {
          id: true, titre: true, adresse: true, ville: true, pays: true,
          typeTransaction: { select: { slug: true, nom: true } },
        },
      },
      locataire: {
        select: { id: true, prenom: true, nom: true, telephone: true, email: true },
      },
      echeancier: {
        where: { statut: "EN_RETARD" },
        orderBy: { dateEcheance: "asc" },
        select: { id: true, dateEcheance: true, montant: true, statut: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return bails.map(bail => {
    const totalRetard = bail.echeancier.reduce((s, e) => s + e.montant, 0);
    const plusAncienne = bail.echeancier[0];
    const joursRetard = plusAncienne
      ? Math.max(0, Math.floor((now.getTime() - new Date(plusAncienne.dateEcheance).getTime()) / 86400000))
      : 0;
    return {
      bailId: bail.id,
      bien: bail.bien,
      locataire: bail.locataire,
      nbEcheancesEnRetard: bail.echeancier.length,
      totalRetard,
      joursRetardMax: joursRetard,
      echeancesEnRetard: bail.echeancier,
    };
  });
};

// ─── Tableau de bord propriétaire ─────────────────────────────────────────────

const NB_MOIS_HISTORIQUE = 12;
const STATUT_BIEN_LOUE = "loue";
const STATUT_BIEN_TRAVAUX = "en-maintenance";

export interface TableauDeBordProprietaire {
  /** Échéances du mois en cours : montant attendu et part déjà payée. */
  moisCourant: { attendu: number; payeSurAttendu: number; encaisse: number };
  /** Loyers encaissés par mois (date de paiement), du plus ancien au mois en cours. */
  encaissementsMensuels: { mois: string; montant: number }[];
  /** Un bien ni loué ni en travaux est compté libre, même sans statut renseigné. */
  biens: { total: number; occupes: number; libres: number; travaux: number };
  /** Statut du loyer du mois en cours par bien loué (le plus urgent si plusieurs échéances). */
  statutsMoisCourant: Record<string, string>;
  /** Paiements déclarés par un locataire, en attente de confirmation du propriétaire. */
  confirmationsEnAttente: {
    echeanceId: string;
    bailId: string;
    bienId: string;
    bienTitre: string | null;
    bienQuartier: string | null;
    locataire: { prenom: string; nom: string };
    montant: number;
  }[];
}

/** Clé « 2026-10 » d'une date, utilisée pour regrouper les encaissements par mois. */
const cleMois = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

// Du plus urgent au moins urgent, pour résumer plusieurs échéances d'un même mois.
const PRIORITE_STATUT_ECHEANCE = ["EN_RETARD", "EN_ATTENTE_CONFIRMATION", "EN_ATTENTE", "A_VENIR", "PAYE"];

const resumerStatutsParBien = (echeances: { bienId: string; statut: string }[]) => {
  const statuts: Record<string, string> = {};
  for (const { bienId, statut } of echeances) {
    const actuel = statuts[bienId];
    if (!actuel || PRIORITE_STATUT_ECHEANCE.indexOf(statut) < PRIORITE_STATUT_ECHEANCE.indexOf(actuel)) {
      statuts[bienId] = statut;
    }
  }
  return statuts;
};

const regrouperParMois = (paiements: { datePaiement: Date | null; montant: number }[], debut: Date) => {
  const totaux = new Map<string, number>();
  for (let i = 0; i < NB_MOIS_HISTORIQUE; i++) {
    totaux.set(cleMois(new Date(debut.getFullYear(), debut.getMonth() + i, 1)), 0);
  }
  for (const paiement of paiements) {
    if (!paiement.datePaiement) continue;
    const cle = cleMois(paiement.datePaiement);
    if (totaux.has(cle)) totaux.set(cle, (totaux.get(cle) ?? 0) + paiement.montant);
  }
  return [...totaux].map(([mois, montant]) => ({ mois, montant }));
};

export const getTableauDeBord = async (proprietaireId: string): Promise<TableauDeBordProprietaire> => {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutMoisSuivant = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const debutHistorique = new Date(now.getFullYear(), now.getMonth() - (NB_MOIS_HISTORIQUE - 1), 1);

  const [echeancesDuMois, paiements, biensParStatut, confirmations] = await Promise.all([
    prisma.echeancierLoyer.findMany({
      where: { proprietaireId, statut: { not: "ANNULE" }, dateEcheance: { gte: debutMois, lt: debutMoisSuivant } },
      select: { montant: true, statut: true, bienId: true },
    }),
    prisma.echeancierLoyer.findMany({
      where: { proprietaireId, statut: "PAYE", datePaiement: { gte: debutHistorique, lt: debutMoisSuivant } },
      select: { montant: true, datePaiement: true },
    }),
    prisma.bien.findMany({
      where: { proprietaireId },
      select: { statutBien: { select: { slug: true } } },
    }),
    prisma.echeancierLoyer.findMany({
      where: { proprietaireId, statut: "EN_ATTENTE_CONFIRMATION", sourceEnregistrement: "LOCATAIRE" },
      orderBy: { dateEcheance: "asc" },
      select: {
        id: true, bailId: true, bienId: true, montant: true,
        bail: {
          select: {
            bien: { select: { titre: true, quartier: true } },
            locataire: { select: { prenom: true, nom: true } },
          },
        },
      },
    }),
  ]);

  const encaissementsMensuels = regrouperParMois(paiements, debutHistorique);
  const occupes = biensParStatut.filter((b) => b.statutBien?.slug === STATUT_BIEN_LOUE).length;
  const travaux = biensParStatut.filter((b) => b.statutBien?.slug === STATUT_BIEN_TRAVAUX).length;

  return {
    moisCourant: {
      attendu: echeancesDuMois.reduce((s, e) => s + e.montant, 0),
      payeSurAttendu: echeancesDuMois.filter((e) => e.statut === "PAYE").reduce((s, e) => s + e.montant, 0),
      encaisse: encaissementsMensuels[encaissementsMensuels.length - 1]?.montant ?? 0,
    },
    encaissementsMensuels,
    biens: { total: biensParStatut.length, occupes, travaux, libres: biensParStatut.length - occupes - travaux },
    statutsMoisCourant: resumerStatutsParBien(echeancesDuMois),
    confirmationsEnAttente: confirmations.map((c) => ({
      echeanceId: c.id,
      bailId: c.bailId,
      bienId: c.bienId,
      bienTitre: c.bail.bien?.titre ?? null,
      bienQuartier: c.bail.bien?.quartier ?? null,
      locataire: { prenom: c.bail.locataire?.prenom ?? "", nom: c.bail.locataire?.nom ?? "" },
      montant: c.montant,
    })),
  };
};
