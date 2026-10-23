import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as ModeleContratService from "../services/modeleContrat.service.js";
import { jsonResponse } from "../utils/responseApi.js";

// ─── List (admin) ─────────────────────────────────────────────────────────────

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const typeBail = req.query.typeBail as string | undefined;
  const actifStr = req.query.actif as string | undefined;
  const actif = actifStr === "true" ? true : actifStr === "false" ? false : undefined;

  const result = await ModeleContratService.getAll({ page, limit, typeBail, actif });
  res.status(StatusCodes.OK).json({
    ...jsonResponse({ status: "success", message: "Modèles récupérés", data: result.items }),
    meta: result.meta
  });
};

// ─── Liste publique (owner) ───────────────────────────────────────────────────

export const getActifs = async (req: Request, res: Response): Promise<void> => {
  const typeBail = req.query.typeBail as string | undefined;
  const items = await ModeleContratService.getActifs(typeBail);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Modèles actifs récupérés", data: items })
  );
};

// ─── Create ──────────────────────────────────────────────────────────────────

export const create = async (req: Request, res: Response): Promise<void> => {
  const { titre, typeBail, contenu, actif, ordre } = req.body;
  if (!titre || !contenu) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "titre et contenu sont requis" })
    );
    return;
  }
  const modele = await ModeleContratService.create({ titre, typeBail: typeBail ?? null, contenu, actif, ordre });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Modèle créé", data: modele })
  );
};

// ─── Update ──────────────────────────────────────────────────────────────────

export const update = async (req: Request, res: Response): Promise<void> => {
  const { titre, typeBail, contenu, actif, ordre } = req.body;
  const modele = await ModeleContratService.update(req.params.id as string, {
    titre,
    typeBail: typeBail !== undefined ? typeBail ?? null : undefined,
    contenu,
    actif,
    ordre,
  });
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Modèle mis à jour", data: modele })
  );
};

// ─── Delete ──────────────────────────────────────────────────────────────────

export const remove = async (req: Request, res: Response): Promise<void> => {
  await ModeleContratService.remove(req.params.id as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Modèle supprimé" })
  );
};
