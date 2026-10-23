import type { Request, Response, NextFunction } from "express";
import * as SignalementService from "../services/signalement.service.js";
import { StatusCodes } from "http-status-codes";

export const createSignalement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bienId, nom, telephone, motif, commentaire } = req.body;
    
    const comptePublicId = req.user?.id ?? null;

    const data = {
      bienId,
      nom,
      telephone,
      motif,
      commentaire,
      comptePublicId
    };

    const signalement = await SignalementService.createSignalement(data);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Signalement envoyé avec succès",
      data: signalement
    });
  } catch (err) {
    next(err);
  }
};

export const getSignalementsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { statut, search } = req.query;
    
    const filter = {
      statut: statut as string,
      search: search as string
    };

    const signalements = await SignalementService.getSignalements(filter);

    res.status(StatusCodes.OK).json({
      success: true,
      data: signalements
    });
  } catch (err) {
    next(err);
  }
};

export const getSignalementByIdAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const signalement = await SignalementService.getSignalementById(id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: signalement
    });
  } catch (err) {
    next(err);
  }
};

export const validerSignalementAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.admin?.id ?? "admin_system";

    const signalement = await SignalementService.validerSignalement(id, adminId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Signalement validé, annonce supprimée et SMS envoyés",
      data: signalement
    });
  } catch (err) {
    next(err);
  }
};

export const rejeterSignalementAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.admin?.id ?? "admin_system";

    const signalement = await SignalementService.rejeterSignalement(id, adminId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Signalement rejeté et archivé",
      data: signalement
    });
  } catch (err) {
    next(err);
  }
};
