import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as Service from "../services/categorieMeuble.service.js";
import { jsonResponse } from "../utils/responseApi.js";

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  const items = await Service.getAll();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Catégories récupérées", data: items }));
};

export const getActive = async (_req: Request, res: Response): Promise<void> => {
  const items = await Service.getActive();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Catégories récupérées", data: items }));
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const item = await Service.create({ nom: req.body.nom, actif: req.body.actif, ordre: req.body.ordre });
  res.status(StatusCodes.CREATED).json(jsonResponse({ status: "success", message: "Catégorie créée", data: item }));
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const item = await Service.update(req.params.id as string, { nom: req.body.nom, actif: req.body.actif, ordre: req.body.ordre });
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Catégorie mise à jour", data: item }));
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  await Service.remove(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Catégorie supprimée" }));
};
