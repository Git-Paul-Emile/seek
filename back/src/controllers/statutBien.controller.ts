import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as StatutBienService from "../services/statutBien.service.js";
import { jsonResponse } from "../utils/responseApi.js";

// GET /api/statuts-bien - public
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  const statuts = await StatutBienService.getAll();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statuts récupérés", data: statuts })
  );
};

// GET /api/statuts-bien/admin - admin
export const getAllAdmin = async (_req: Request, res: Response): Promise<void> => {
  const statuts = await StatutBienService.getAllAdmin();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statuts récupérés", data: statuts })
  );
};

// POST /api/statuts-bien - admin
export const create = async (req: Request, res: Response): Promise<void> => {
  const statut = await StatutBienService.create({
    nom:   req.body.nom,
    ordre: req.body.ordre !== undefined ? Number(req.body.ordre) : undefined,
  });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Statut créé", data: statut })
  );
};

// PUT /api/statuts-bien/:id - admin
export const update = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const updatePayload: Record<string, unknown> = {};
  if (req.body.nom   !== undefined) updatePayload.nom   = req.body.nom;
  if (req.body.actif !== undefined) updatePayload.actif = req.body.actif;
  if (req.body.ordre !== undefined && req.body.ordre !== "") {
    updatePayload.ordre = Number(req.body.ordre);
  }

  const statut = await StatutBienService.update(id, updatePayload as any);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statut mis à jour", data: statut })
  );
};

// DELETE /api/statuts-bien/:id - admin
export const remove = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await StatutBienService.remove(id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statut supprimé" })
  );
};
