import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as Service from "../services/typeLogementEquipement.service.js";
import { jsonResponse } from "../utils/responseApi.js";

export const getEquipements = async (req: Request, res: Response): Promise<void> => {
  const items = await Service.getEquipementsForTypeLogement(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Équipements récupérés", data: items }));
};

export const getEquipementsAdmin = async (req: Request, res: Response): Promise<void> => {
  const items = await Service.getAllEquipementsWithState(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Équipements récupérés", data: items }));
};

export const setEquipements = async (req: Request, res: Response): Promise<void> => {
  const equipementIds: string[] = req.body.equipementIds ?? [];
  await Service.setEquipementsForTypeLogement(req.params.id as string, equipementIds);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Configuration enregistrée" }));
};
