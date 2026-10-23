import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { emitVerificationSubmitted } from "./socket.service.js";
import { envoyerNotification } from "./notification.service.js";

export interface VerificationStatus {
  proprietaireId: string;
  statut: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: Date | null;
  documents?: {
    typePiece: string;
    pieceIdentiteRecto: string | null;
    pieceIdentiteVerso: string | null;
    selfie: string | null;
    conditionsAcceptees: boolean;
    motifRejet?: string | null;
    traitePar?: string | null;
    dateTraitement?: Date | null;
  };
}

export interface ProprietaireWithVerification {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  statutVerification: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: Date | null;
  createdAt: Date;
  verification: {
    id: string;
    typePiece: string;
    pieceIdentiteRecto: string | null;
    pieceIdentiteVerso: string | null;
    selfie: string | null;
    conditionsAcceptees: boolean;
    motifRejet: string | null;
    traitePar: string | null;
    dateTraitement: Date | null;
    createdAt: Date;
  } | null;
}

export const verificationService = {
  /**
   * Récupère le statut de vérification d'un propriétaire
   */
  async getStatus(proprietaireId: string): Promise<VerificationStatus> {
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
      include: {
        verification: true,
      },
    });

    if (!proprietaire) {
      throw new AppError("Propriétaire non trouvé", 404);
    }

    return {
      proprietaireId: proprietaire.id,
      statut: proprietaire.statutVerification,
      verifiedAt: proprietaire.verifiedAt,
      documents: proprietaire.verification
        ? {
            typePiece: proprietaire.verification.typePiece,
            pieceIdentiteRecto: proprietaire.verification.pieceIdentiteRecto,
            pieceIdentiteVerso: proprietaire.verification.pieceIdentiteVerso,
            selfie: proprietaire.verification.selfie,
            conditionsAcceptees: proprietaire.verification.conditionsAcceptees,
            motifRejet: proprietaire.verification.motifRejet,
            traitePar: proprietaire.verification.traitePar,
            dateTraitement: proprietaire.verification.dateTraitement,
          }
        : undefined,
    };
  },

  /**
   * Récupère toutes les demandes en attente (pour l'admin)
   */
  async getPendingVerifications(): Promise<ProprietaireWithVerification[]> {
    const proprietaires = await prisma.proprietaire.findMany({
      where: {
        statutVerification: "PENDING",
      },
      include: {
        verification: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return proprietaires.map((p) => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      telephone: p.telephone,
      email: p.email,
      statutVerification: p.statutVerification,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
      verification: p.verification
        ? {
            id: p.verification.id,
            typePiece: p.verification.typePiece,
            pieceIdentiteRecto: p.verification.pieceIdentiteRecto,
            pieceIdentiteVerso: p.verification.pieceIdentiteVerso,
            selfie: p.verification.selfie,
            conditionsAcceptees: p.verification.conditionsAcceptees,
            motifRejet: p.verification.motifRejet,
            traitePar: p.verification.traitePar,
            dateTraitement: p.verification.dateTraitement,
            createdAt: p.verification.createdAt,
          }
        : null,
    }));
  },

  /**
   * Soumet une demande de vérification d'identité
   */
  async submitVerification(
    proprietaireId: string,
    data: {
      typePiece: string;
      pieceIdentiteRecto: string;
      pieceIdentiteVerso?: string;
      selfie: string;
      conditionsAcceptees: boolean;
    }
  ): Promise<VerificationStatus> {
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
    });

    if (!proprietaire) {
      throw new AppError("Propriétaire non trouvé", 404);
    }

    if (proprietaire.statutVerification === "VERIFIED") {
      throw new AppError("Votre compte est déjà vérifié", 400);
    }

    // Créer ou mettre à jour les documents de vérification
    await prisma.verificationDocuments.upsert({
      where: { proprietaireId },
      create: {
        proprietaireId,
        typePiece: data.typePiece,
        pieceIdentiteRecto: data.pieceIdentiteRecto,
        pieceIdentiteVerso: data.pieceIdentiteVerso || null,
        selfie: data.selfie,
        conditionsAcceptees: data.conditionsAcceptees,
      },
      update: {
        typePiece: data.typePiece,
        pieceIdentiteRecto: data.pieceIdentiteRecto,
        pieceIdentiteVerso: data.pieceIdentiteVerso || null,
        selfie: data.selfie,
        conditionsAcceptees: data.conditionsAcceptees,
        motifRejet: null,
        traitePar: null,
        dateTraitement: null,
      },
    });

    // Mettre à jour le statut du propriétaire
    await prisma.proprietaire.update({
      where: { id: proprietaireId },
      data: {
        statutVerification: "PENDING",
      },
    });

    // Notifier les admins en temps réel
    emitVerificationSubmitted(proprietaireId).catch(() => null);

    return this.getStatus(proprietaireId);
  },

  /**
   * Approuve la vérification d'un propriétaire (admin)
   */
  async approve(
    proprietaireId: string,
    adminId: string
  ): Promise<VerificationStatus> {
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
      include: { verification: true },
    });

    if (!proprietaire) {
      throw new AppError("Propriétaire non trouvé", 404);
    }

    if (proprietaire.statutVerification !== "PENDING") {
      throw new AppError("Ce propriétaire n'a pas de demande en attente", 400);
    }

    if (!proprietaire.verification) {
      throw new AppError("Aucun document de vérification trouvé pour ce propriétaire", 400);
    }

    await prisma.$transaction([
      prisma.proprietaire.update({
        where: { id: proprietaireId },
        data: {
          statutVerification: "VERIFIED",
          verifiedAt: new Date(),
        },
      }),
      prisma.verificationDocuments.update({
        where: { proprietaireId },
        data: {
          traitePar: adminId,
          dateTraitement: new Date(),
          motifRejet: null,
        },
      }),
    ]);

    // Notifier le propriétaire via notification in-app (sans SMS/email)
    envoyerNotification({
      type: "ALERTE",
      telephone: proprietaire.telephone,
      email: proprietaire.email ?? undefined,
      sujet: "Compte vérifié – Badge confiance activé",
      contenu: "Félicitations ! Votre identité a été vérifiée. Votre badge de confiance est maintenant actif sur vos annonces.",
      proprietaireId,
      noSmsEmail: true,
    }).catch(() => null);

    return this.getStatus(proprietaireId);
  },

  /**
   * Rejette la vérification d'un propriétaire (admin)
   */
  async reject(
    proprietaireId: string,
    adminId: string,
    motif: string
  ): Promise<VerificationStatus> {
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
      include: { verification: true },
    });

    if (!proprietaire) {
      throw new AppError("Propriétaire non trouvé", 404);
    }

    if (proprietaire.statutVerification !== "PENDING") {
      throw new AppError("Ce propriétaire n'a pas de demande en attente", 400);
    }

    if (!proprietaire.verification) {
      throw new AppError("Aucun document de vérification trouvé pour ce propriétaire", 400);
    }

    await prisma.$transaction([
      prisma.proprietaire.update({
        where: { id: proprietaireId },
        data: {
          statutVerification: "REJECTED",
          verifiedAt: null,
        },
      }),
      prisma.verificationDocuments.update({
        where: { proprietaireId },
        data: {
          motifRejet: motif,
          traitePar: adminId,
          dateTraitement: new Date(),
        },
      }),
    ]);

    return this.getStatus(proprietaireId);
  },

  /**
   * Annule la demande de vérification (propriétaire)
   */
  async cancel(proprietaireId: string): Promise<VerificationStatus> {
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
    });

    if (!proprietaire) {
      throw new AppError("Propriétaire non trouvé", 404);
    }

    if (proprietaire.statutVerification !== "PENDING") {
      throw new AppError("Aucune demande en cours à annuler", 400);
    }

    await prisma.proprietaire.update({
      where: { id: proprietaireId },
      data: {
        statutVerification: "NOT_VERIFIED",
      },
    });

    // Supprimer les documents
    await prisma.verificationDocuments.delete({
      where: { proprietaireId },
    }).catch(() => {});

    return this.getStatus(proprietaireId);
  },
};
