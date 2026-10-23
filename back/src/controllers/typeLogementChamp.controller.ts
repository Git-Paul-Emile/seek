import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as Service from "../services/typeLogementChamp.service.js";
import { jsonResponse } from "../utils/responseApi.js";

export const getChamps = async (req: Request, res: Response): Promise<void> => {
  const items = await Service.getChampsForTypeLogement(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Champs récupérés", data: items }));
};

export const getChampsAdmin = async (req: Request, res: Response): Promise<void> => {
  const items = await Service.getAllChampsWithState(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Champs récupérés", data: items }));
};

export const setChamps = async (req: Request, res: Response): Promise<void> => {
  const items: { champId: string; obligatoire: boolean; ordre: number }[] = req.body.champs ?? [];
  await Service.setChampsForTypeLogement(req.params.id as string, items);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Configuration enregistrée" }));
};
