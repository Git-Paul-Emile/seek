import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as MeubleService from "../services/meuble.service.js";
import { jsonResponse } from "../utils/responseApi.js";

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  const items = await MeubleService.getAll();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Meubles récupérés", data: items }));
};

export const getAllAdmin = async (_req: Request, res: Response): Promise<void> => {
  const items = await MeubleService.getAllAdmin();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Meubles récupérés", data: items }));
};

export const createMany = async (req: Request, res: Response): Promise<void> => {
  const items = await MeubleService.createMany(
    req.body.items as { nom: string; categorieId: string }[]
  );
  res.status(StatusCodes.CREATED).json(jsonResponse({ status: "success", message: "Meubles créés", data: items }));
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const item = await MeubleService.update(req.params.id as string, {
    nom:         req.body.nom,
    categorieId: req.body.categorieId,
    actif:       req.body.actif,
  });
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Meuble mis à jour", data: item }));
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  await MeubleService.remove(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Meuble supprimé" }));
};
