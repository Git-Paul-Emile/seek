import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

/**
 * Interface pour les options de pagination
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Interface pour le résultat paginé
 */
interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Récupère l'historique des transactions d'un propriétaire
 */
export const getHistoriqueTransactions = async (
  proprietaireId: string,
  options: PaginationOptions = {},
  filters?: {
    type?: string;
    statut?: string;
    bienId?: string;
    dateDebut?: Date;
    dateFin?: Date;
  }
): Promise<PaginatedResult<any>> => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {
    proprietaireId,
  };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.statut) {
    where.statut = filters.statut;
  }

  if (filters?.bienId) {
    where.bienId = filters.bienId;
  }

  if (filters?.dateDebut || filters?.dateFin) {
    where.dateInitiation = {};
    if (filters?.dateDebut) {
      where.dateInitiation.gte = filters.dateDebut;
    }
    if (filters?.dateFin) {
      where.dateInitiation.lte = filters.dateFin;
    }
  }

  // Requête principale
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        dateInitiation: "desc",
      },
      include: {
        bien: {
          select: {
            id: true,
            titre: true,
            photos: true,
          },
        },
        bail: {
          select: {
            id: true,
            bien: {
              select: {
                titre: true,
              },
            },
          },
        },
        locataire: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Récupère une transaction par son ID
 */
export const getTransactionById = async (
  transactionId: string,
  proprietaireId: string
) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      proprietaireId,
    },
    include: {
      bien: true,
      bail: {
        include: {
          bien: {
            select: {
              id: true,
              titre: true,
            },
          },
          locataire: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              telephone: true,
            },
          },
        },
      },
      echeance: true,
      locataire: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          telephone: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new AppError("Transaction introuvable", StatusCodes.NOT_FOUND);
  }

  return transaction;
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAdminHistoriqueTransactions = async (
  options: PaginationOptions = {},
  filters?: { type?: string; statut?: string; proprietaireId?: string; dateDebut?: Date; dateFin?: Date; search?: string }
): Promise<PaginatedResult<any>> => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.statut) where.statut = filters.statut;
  if (filters?.proprietaireId) where.proprietaireId = filters.proprietaireId;
  if (filters?.dateDebut || filters?.dateFin) {
    where.dateInitiation = {};
    if (filters?.dateDebut) where.dateInitiation.gte = filters.dateDebut;
    if (filters?.dateFin) where.dateInitiation.lte = filters.dateFin;
  }
  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { reference: { contains: s, mode: "insensitive" } },
      { transactionId: { contains: s, mode: "insensitive" } },
      { proprietaire: { telephone: { contains: s, mode: "insensitive" } } },
      { locataire: { telephone: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateInitiation: "desc" },
      include: {
        bien: { select: { id: true, titre: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, telephone: true } },
        locataire: { select: { id: true, nom: true, prenom: true, telephone: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getAdminStatsTransactions = async () => {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutAnnee = new Date(now.getFullYear(), 0, 1);

  // 12 derniers mois pour la tendance
  const douzeDebutMois = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [totalConfirme, montantTotal, montantMois, montantAnnee, parType, transactions12Mois] = await Promise.all([
    prisma.transaction.count({ where: { statut: "CONFIRME" } }),
    prisma.transaction.aggregate({ where: { statut: "CONFIRME" }, _sum: { montant: true } }),
    prisma.transaction.aggregate({ where: { statut: "CONFIRME", dateConfirmation: { gte: debutMois } }, _sum: { montant: true } }),
    prisma.transaction.aggregate({ where: { statut: "CONFIRME", dateConfirmation: { gte: debutAnnee } }, _sum: { montant: true } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { statut: "CONFIRME" },
      _count: true,
      _sum: { montant: true },
    }),
    prisma.transaction.findMany({
      where: { statut: "CONFIRME", dateInitiation: { gte: douzeDebutMois } },
      select: { dateInitiation: true, montant: true },
    }),
  ]);

  // Grouper par mois en TypeScript
  const parMoisMap: Record<string, { count: number; montant: number }> = {};
  for (const t of transactions12Mois) {
    const d = new Date(t.dateInitiation);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!parMoisMap[key]) parMoisMap[key] = { count: 0, montant: 0 };
    parMoisMap[key].count++;
    parMoisMap[key].montant += t.montant;
  }

  const par12Mois = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    return { mois: key, label, ...(parMoisMap[key] ?? { count: 0, montant: 0 }) };
  });

  return {
    totalConfirme,
    montantTotal: montantTotal._sum.montant ?? 0,
    montantMois: montantMois._sum.montant ?? 0,
    montantAnnee: montantAnnee._sum.montant ?? 0,
    parType: parType.map((r) => ({ type: r.type, nombre: r._count, montant: r._sum.montant ?? 0 })),
    par12Mois,
  };
};

/**
 * Récupère les statistiques des transactions d'un propriétaire
 */
export const getStatsTransactions = async (proprietaireId: string) => {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutAnnee = new Date(now.getFullYear(), 0, 1);

  // Statistiques globales
  const [totalTransactions, totalMontant] = await Promise.all([
    prisma.transaction.count({
      where: {
        proprietaireId,
        statut: "CONFIRME",
      },
    }),
    prisma.transaction.aggregate({
      where: {
        proprietaireId,
        statut: "CONFIRME",
      },
      _sum: {
        montant: true,
      },
    }),
  ]);

  // Statistiques du mois en cours
  const [transactionsMois, montantMois] = await Promise.all([
    prisma.transaction.count({
      where: {
        proprietaireId,
        statut: "CONFIRME",
        dateConfirmation: {
          gte: debutMois,
        },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        proprietaireId,
        statut: "CONFIRME",
        dateConfirmation: {
          gte: debutMois,
        },
      },
      _sum: {
        montant: true,
      },
    }),
  ]);

  // Statistiques de l'année en cours
  const [transactionsAnnee, montantAnnee] = await Promise.all([
    prisma.transaction.count({
      where: {
        proprietaireId,
        statut: "CONFIRME",
        dateConfirmation: {
          gte: debutAnnee,
        },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        proprietaireId,
        statut: "CONFIRME",
        dateConfirmation: {
          gte: debutAnnee,
        },
      },
      _sum: {
        montant: true,
      },
    }),
  ]);

  // Répartition par type de transaction
  const repartitionParType = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      proprietaireId,
      statut: "CONFIRME",
    },
    _count: true,
    _sum: {
      montant: true,
    },
  });

  // Répartition par mode de paiement
  const repartitionParMode = await prisma.transaction.groupBy({
    by: ["modePaiement"],
    where: {
      proprietaireId,
      statut: "CONFIRME",
    },
    _count: true,
    _sum: {
      montant: true,
    },
  });

  return {
    global: {
      totalTransactions,
      totalMontant: totalMontant._sum.montant || 0,
    },
    mois: {
      transactions: transactionsMois,
      montant: montantMois._sum.montant || 0,
    },
    annee: {
      transactions: transactionsAnnee,
      montant: montantAnnee._sum.montant || 0,
    },
    repartitionParType: repartitionParType.map((r) => ({
      type: r.type,
      nombre: r._count,
      montant: r._sum.montant || 0,
    })),
    repartitionParMode: repartitionParMode.map((r) => ({
      mode: r.modePaiement,
      nombre: r._count,
      montant: r._sum.montant || 0,
    })),
  };
};
