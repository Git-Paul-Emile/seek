import { prisma } from "../config/database.js";

// ─── Liste des propriétaires avec filtres ──────────────────────────────────────

export interface GetProprietairesFilter {
  estSuspendu?: boolean;
  search?: string;
}

export const getProprietaires = async (filter?: GetProprietairesFilter) => {
  const where: any = {};
  
  if (filter?.estSuspendu !== undefined) {
    where.estSuspendu = filter.estSuspendu;
  }
  
  if (filter?.search) {
    where.OR = [
      { prenom: { contains: filter.search, mode: "insensitive" } },
      { nom: { contains: filter.search, mode: "insensitive" } },
      { telephone: { contains: filter.search } },
      { email: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  
  return prisma.proprietaire.findMany({
    where,
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      dateFinSuspension: true,
      suspenduPar: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getProprietaireById = async (id: string) => {
  return prisma.proprietaire.findUnique({
    where: { id },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      dateFinSuspension: true,
      suspenduPar: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// ─── Liste des locataires avec filtres ───────────────────────────────────────

export interface GetLocatairesFilter {
  estSuspendu?: boolean;
  search?: string;
}

export const getLocataires = async (filter?: GetLocatairesFilter) => {
  const where: any = {};
  
  if (filter?.estSuspendu !== undefined) {
    where.estSuspendu = filter.estSuspendu;
  }
  
  if (filter?.search) {
    where.OR = [
      { prenom: { contains: filter.search, mode: "insensitive" } },
      { nom: { contains: filter.search, mode: "insensitive" } },
      { telephone: { contains: filter.search } },
      { email: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  
  return prisma.locataire.findMany({
    where,
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      suspenduPar: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getLocataireById = async (id: string) => {
  return prisma.locataire.findUnique({
    where: { id },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      suspenduPar: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// ─── Supprimer un propriétaire ─────────────────────────────────────────────────

export const supprimerProprietaire = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    // Supprimer les biens du propriétaire
    await tx.bien.deleteMany({ where: { proprietaireId: id } });
    // Supprimer les tokens de refresh
    await tx.proprietaireRefreshToken.deleteMany({ where: { proprietaireId: id } });
    // Supprimer le propriétaire
    return tx.proprietaire.delete({ where: { id } });
  });
};

// ─── Supprimer un locataire ─────────────────────────────────────────────────────

export const supprimerLocataire = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    // Supprimer les baux
    await tx.bailLocation.deleteMany({ where: { locataireId: id } });
    // Supprimer les tokens de refresh
    await tx.locataireRefreshToken.deleteMany({ where: { locataireId: id } });
    // Supprimer le locataire
    return tx.locataire.delete({ where: { id } });
  });
};

// ─── Détails d'un propriétaire avec ses biens ─────────────────────────────────

export const getProprietaireWithBiens = async (id: string) => {
  return prisma.proprietaire.findUnique({
    where: { id },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      dateFinSuspension: true,
      suspenduPar: true,
      createdAt: true,
      updatedAt: true,
      biens: {
        select: {
          id: true,
          titre: true,
          pays: true,
          region: true,
          ville: true,
          quartier: true,
          adresse: true,
          prix: true,
          surface: true,
          nbChambres: true,
          nbSdb: true,
          nbPieces: true,
          statutAnnonce: true,
          typeLogement: {
            select: {
              nom: true,
            },
          },
          typeTransaction: {
            select: {
              nom: true,
            },
          },
          statutBien: {
            select: {
              nom: true,
            },
          },
          actif: true,
        },
      },
    },
  });
};

// ─── Détails d'un locataire avec ses baux ─────────────────────────────────────

export const getLocataireWithBails = async (id: string) => {
  return prisma.locataire.findUnique({
    where: { id },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      suspenduPar: true,
      createdAt: true,
      updatedAt: true,
      // Infos du propriétaire qui a créé ce locataire
      proprietaire: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          telephone: true,
          email: true,
        },
      },
      bails: {
        select: {
          id: true,
          typeBail: true,
          statut: true,
          dateDebutBail: true,
          dateFinBail: true,
          montantLoyer: true,
          montantCaution: true,
          cautionVersee: true,
          frequencePaiement: true,
          createdAt: true,
          updatedAt: true,
          // Infos du bien
          bien: {
            select: {
              id: true,
              titre: true,
              description: true,
              pays: true,
              region: true,
              ville: true,
              quartier: true,
              adresse: true,
              surface: true,
              nbChambres: true,
              nbSdb: true,
              nbPieces: true,
              etage: true,
              actif: true,
              // Quartier avec ville et pays
              quartierRel: {
                select: {
                  id: true,
                  nom: true,
                  ville: {
                    select: {
                      id: true,
                      nom: true,
                      pays: {
                        select: {
                          id: true,
                          nom: true,
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
              // Type de logement et transaction
              typeLogement: {
                select: {
                  id: true,
                  nom: true,
                },
              },
              typeTransaction: {
                select: {
                  id: true,
                  nom: true,
                },
              },
              statutBien: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
          // Infos du propriétaire du bien
          proprietaire: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              telephone: true,
              email: true,
            },
          },
          // Contrat
          contrat: {
            select: {
              id: true,
              titre: true,
              contenu: true,
              statut: true,
              createdAt: true,
              updatedAt: true,
              modele: {
                select: {
                  id: true,
                  titre: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

// ─── Admin : locataire avec documents de vérification ────────────────────────

export const getLocataireAvecDocuments = async (id: string) => {
  return prisma.locataire.findUnique({
    where: { id },
    include: {
      proprietaire: { select: { id: true, prenom: true, nom: true, telephone: true, email: true } },
      verification: true,
      bails: {
        orderBy: { createdAt: "desc" },
        include: {
          bien: { select: { id: true, titre: true, ville: true, adresse: true } },
        },
      },
    },
  });
};

// ─── Suspension Propriétaire ─────────────────────────────────────────────────────

export const suspendreProprietaire = async (
  id: string,
  motif: string,
  suspenduPar: string,
  dateFinSuspension: Date | null = null
) => {
  return prisma.proprietaire.update({
    where: { id },
    data: {
      estSuspendu: true,
      motifSuspension: motif,
      dateSuspension: new Date(),
      dateFinSuspension,
      suspenduPar,
    },
  });
};

export const reactiverProprietaire = async (id: string) => {
  return prisma.proprietaire.update({
    where: { id },
    data: {
      estSuspendu: false,
      motifSuspension: null,
      dateSuspension: null,
      dateFinSuspension: null,
      suspenduPar: null,
      // Repart d'un compteur à zéro : une réactivation efface l'historique de signalements
      // qui a mené à la suspension, sinon un seul nouveau signalement validé re-suspendrait
      // immédiatement le compte malgré la décision de l'admin de redonner sa chance au propriétaire.
      nbSignalementsValides: 0,
    },
  });
};

export const getProprietaireSuspendu = async (id: string) => {
  return prisma.proprietaire.findUnique({
    where: { id },
    select: {
      id: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      dateFinSuspension: true,
      suspenduPar: true,
    },
  });
};

// ─── Suspension Locataire ───────────────────────────────────────────────────────

export const suspendreLocataire = async (
  id: string,
  motif: string,
  suspenduPar: string
) => {
  return prisma.locataire.update({
    where: { id },
    data: {
      estSuspendu: true,
      motifSuspension: motif,
      dateSuspension: new Date(),
      suspenduPar,
    },
  });
};

export const reactiverLocataire = async (id: string) => {
  return prisma.locataire.update({
    where: { id },
    data: {
      estSuspendu: false,
      motifSuspension: null,
      dateSuspension: null,
      suspenduPar: null,
    },
  });
};

export const getLocataireSuspendu = async (id: string) => {
  return prisma.locataire.findUnique({
    where: { id },
    select: {
      id: true,
      estSuspendu: true,
      motifSuspension: true,
      dateSuspension: true,
      suspenduPar: true,
    },
  });
};

// ─── Masquer les annonces d'un propriétaire suspendu ────────────────────────────

export const masquerAnnoncesProprietaire = async (proprietaireId: string) => {
  return prisma.bien.updateMany({
    where: { proprietaireId },
    data: { actif: false },
  });
};

export const afficherAnnoncesProprietaire = async (proprietaireId: string) => {
  return prisma.bien.updateMany({
    where: { proprietaireId },
    data: { actif: true },
  });
};

// ─── Vérifications avant suppression ─────────────────────────────────────────

/**
 * Vérifie si le propriétaire a des biens actifs (annonces en ligne)
 */
export const hasBiensActifs = async (proprietaireId: string): Promise<boolean> => {
  const count = await prisma.bien.count({
    where: {
      proprietaireId,
      actif: true,
    },
  });
  return count > 0;
};

/**
 * Vérifie si le propriétaire a des baux actifs (locataires associés)
 */
export const hasBauxActifs = async (proprietaireId: string): Promise<boolean> => {
  const count = await prisma.bailLocation.count({
    where: {
      proprietaireId,
      statut: "ACTIF",
    },
  });
  return count > 0;
};

/**
 * Vérifie si le propriétaire a des transactions de mise en avant (promotions)
 */
export const hasPaiementsPromotion = async (proprietaireId: string): Promise<boolean> => {
  const count = await prisma.promotionHistory.count({
    where: {
      proprietaireId,
    },
  });
  return count > 0;
};
