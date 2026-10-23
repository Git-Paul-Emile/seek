import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as TypeTransactionService from "../services/typeTransaction.service.js";
import { jsonResponse } from "../utils/responseApi.js";

// GET /api/types-transaction - public
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  const types = await TypeTransactionService.getAll();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Types de transaction récupérés", data: types })
  );
};

// GET /api/types-transaction/admin - admin (inclut inactifs)
export const getAllAdmin = async (_req: Request, res: Response): Promise<void> => {
  const types = await TypeTransactionService.getAllAdmin();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Types de transaction récupérés", data: types })
  );
};

// POST /api/types-transaction - admin
export const create = async (req: Request, res: Response): Promise<void> => {
  const type = await TypeTransactionService.create({
    nom:   req.body.nom,
    ordre: req.body.ordre !== undefined ? Number(req.body.ordre) : undefined,
  });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Type de transaction créé", data: type })
  );
};

// PUT /api/types-transaction/:id - admin
export const update = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const updatePayload: Record<string, unknown> = {};
  if (req.body.nom   !== undefined) updatePayload.nom   = req.body.nom;
  if (req.body.actif !== undefined) updatePayload.actif = req.body.actif;
  if (req.body.ordre !== undefined && req.body.ordre !== "") {
    updatePayload.ordre = Number(req.body.ordre);
  }

  const type = await TypeTransactionService.update(id, updatePayload as any);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Type de transaction mis à jour", data: type })
  );
};

// DELETE /api/types-transaction/:id - admin
export const remove = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await TypeTransactionService.remove(id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Type de transaction supprimé" })
  );
};
