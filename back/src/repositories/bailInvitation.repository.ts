import { prisma } from "../config/database.js";
import { StatutBailInvitation } from "../generated/prisma/enums.js";

// ─── Include helper ───────────────────────────────────────────────────────────

const INVITATION_INCLUDE_OWNER = {
  bien: { select: { id: true, titre: true, ville: true, adresse: true, quartier: true } },
  locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true } },
} as const;

const INVITATION_INCLUDE_LOCATAIRE = {
  bien: { select: { id: true, titre: true, ville: true, adresse: true, quartier: true } },
  proprietaire: { select: { id: true, nom: true, prenom: true, telephone: true } },
} as const;

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export interface CreateInvitationData {
  bienId: string;
  locataireId: string;
  proprietaireId: string;
  typeBail?: string | null;
  dateDebutBail: Date;
  dateFinBail?: Date | null;
  montantLoyer: number;
  montantCaution?: number | null;
  cautionVersee?: boolean;
  jourLimitePaiement?: number | null;
  renouvellement?: boolean;
  frequencePaiement?: string | null;
  expiresAt: Date;
}

export const create = async (data: CreateInvitationData) => {
  return prisma.bailInvitation.create({
    data,
    include: INVITATION_INCLUDE_OWNER,
  });
};

export const findByToken = async (token: string) => {
  return prisma.bailInvitation.findUnique({
    where: { token },
    include: {
      ...INVITATION_INCLUDE_LOCATAIRE,
      locataire: { select: { id: true, nom: true, prenom: true, telephone: true, email: true } },
    },
  });
};

export const findByLocataireId = async (locataireId: string) => {
  return prisma.bailInvitation.findMany({
    where: {
      locataireId,
      statut: StatutBailInvitation.PENDING,
      expiresAt: { gt: new Date() },
    },
    include: INVITATION_INCLUDE_LOCATAIRE,
    orderBy: { createdAt: "desc" },
  });
};

export const findByProprietaireId = async (proprietaireId: string) => {
  return prisma.bailInvitation.findMany({
    where: { proprietaireId },
    include: INVITATION_INCLUDE_OWNER,
    orderBy: { createdAt: "desc" },
  });
};

export const findPendingByBienAndLocataire = async (bienId: string, locataireId: string) => {
  return prisma.bailInvitation.findFirst({
    where: { bienId, locataireId, statut: StatutBailInvitation.PENDING },
  });
};

export const updateStatut = async (id: string, statut: StatutBailInvitation) => {
  return prisma.bailInvitation.update({
    where: { id },
    data: { statut },
  });
};

// Expire les anciennes invitations dépassées
export const expireOldInvitations = async () => {
  return prisma.bailInvitation.updateMany({
    where: { statut: StatutBailInvitation.PENDING, expiresAt: { lt: new Date() } },
    data: { statut: StatutBailInvitation.EXPIREE },
  });
};
