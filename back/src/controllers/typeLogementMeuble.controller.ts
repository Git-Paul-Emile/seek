import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as Service from "../services/typeLogementMeuble.service.js";
import { jsonResponse } from "../utils/responseApi.js";

export const getMeubles = async (req: Request, res: Response): Promise<void> => {
  const items = await Service.getMeublesForTypeLogement(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Meubles récupérés", data: items }));
};

export const getMeublesAdmin = async (req: Request, res: Response): Promise<void> => {
  const items = await Service.getAllMeublesWithState(req.params.id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Meubles récupérés", data: items }));
};

export const setMeubles = async (req: Request, res: Response): Promise<void> => {
  const meubleIds: string[] = req.body.meubleIds ?? [];
  await Service.setMeublesForTypeLogement(req.params.id as string, meubleIds);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Configuration enregistrée" }));
};
