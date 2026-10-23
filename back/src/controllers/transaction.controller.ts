import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as TransactionService from "../services/transaction.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";

/**
 * Récupère l'historique des transactions du propriétaire connecté
 */
export const getHistorique = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const { page, limit, type, statut, bienId, dateDebut, dateFin } = req.query;

  try {
    const result = await TransactionService.getHistoriqueTransactions(
      proprietaireId,
      {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      },
      {
        type: type as string,
        statut: statut as string,
        bienId: bienId as string,
        dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
        dateFin: dateFin ? new Date(dateFin as string) : undefined,
      }
    );

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Historique des transactions récupéré",
        data: {
          transactions: result.data,
          pagination: result.pagination,
        },
      })
    );
  } catch (error) {
    console.error("[TRANSACTION] Erreur lors de la récupération de l'historique:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      jsonResponse({ status: "error", message: "Une erreur inattendue s'est produite" })
    );
  }
};

/**
 * Récupère les détails d'une transaction spécifique
 */
export const getTransactionDetail = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const { id } = req.params;

  try {
    const transaction = await TransactionService.getTransactionById(id as string, proprietaireId);

    res.status(StatusCodes.OK).json(
      jsonResponse({ status: "success", message: "Transaction récupérée", data: transaction })
    );
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(jsonResponse({ status: "fail", message: error.message }));
      return;
    }
    console.error("[TRANSACTION] Erreur lors de la récupération de la transaction:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      jsonResponse({ status: "error", message: "Une erreur inattendue s'est produite" })
    );
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAdminHistorique = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, type, statut, proprietaireId, dateDebut, dateFin, search } = req.query;
  const result = await TransactionService.getAdminHistoriqueTransactions(
    { page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined },
    {
      type: type as string | undefined,
      statut: statut as string | undefined,
      proprietaireId: proprietaireId as string | undefined,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      search: search as string | undefined,
    }
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Historique admin récupéré", data: result })
  );
};

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await TransactionService.getAdminStatsTransactions();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Stats admin récupérées", data: stats })
  );
};

/**
 * Récupère les statistiques des transactions du propriétaire
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;

  try {
    const stats = await TransactionService.getStatsTransactions(proprietaireId);

    res.status(StatusCodes.OK).json(
      jsonResponse({ status: "success", message: "Statistiques des transactions récupérées", data: stats })
    );
  } catch (error) {
    console.error("[TRANSACTION] Erreur lors de la récupération des statistiques:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      jsonResponse({ status: "error", message: "Une erreur inattendue s'est produite" })
    );
  }
};
