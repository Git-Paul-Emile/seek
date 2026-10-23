import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as Service from "../services/champ.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import type { TypeChamp } from "../generated/prisma/enums.js";

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  const items = await Service.getAll();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Champs récupérés", data: items }));
};

export const getAllAdmin = async (_req: Request, res: Response): Promise<void> => {
  const items = await Service.getAllAdmin();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Champs récupérés", data: items }));
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const item = await Service.create({
    nom:         req.body.nom,
    type:        req.body.type as TypeChamp,
    unite:       req.body.unite ?? null,
    options:     req.body.options ?? [],
    categorieId: req.body.categorieId,
  });
  res.status(StatusCodes.CREATED).json(jsonResponse({ status: "success", message: "Champ créé", data: item }));
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const item = await Service.update(req.params.id as string, {
    nom:         req.body.nom,
    type:        req.body.type as TypeChamp | undefined,
    unite:       req.body.unite,
    options:     req.body.options,
    categorieId: req.body.categorieId,
    actif:       req.body.actif,
  });
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Champ mis à jour", data: item }));
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  await Service.remove(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Champ supprimé" }));
};
