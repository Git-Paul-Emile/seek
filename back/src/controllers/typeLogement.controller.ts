import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as TypeLogementService from "../services/typeLogement.service.js";
import * as CloudinaryService from "../services/cloudinary.service.js";
import { jsonResponse } from "../utils/responseApi.js";

// GET /api/types-logement - public
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  const types = await TypeLogementService.getAll();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Types de logement récupérés", data: types })
  );
};

// GET /api/types-logement/admin - admin (inclut inactifs)
export const getAllAdmin = async (_req: Request, res: Response): Promise<void> => {
  const types = await TypeLogementService.getAllAdmin();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Types de logement récupérés", data: types })
  );
};

// POST /api/types-logement - admin
export const create = async (req: Request, res: Response): Promise<void> => {
  let imageUrl: string | undefined;

  if (req.file) {
    const result = await CloudinaryService.uploadImage(req.file.buffer, "seek/types-logement", { maxDimension: 600, quality: 85 });
    imageUrl = result.url;
  }

  const type = await TypeLogementService.create({
    nom: req.body.nom,
    image: imageUrl,
    ordre: req.body.ordre !== undefined ? Number(req.body.ordre) : undefined,
  });

  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Type de logement créé", data: type })
  );
};

// PUT /api/types-logement/:id - admin
export const update = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  let imageUrl: string | undefined;

  if (req.file) {
    // Supprimer l'ancienne image Cloudinary avant d'uploader la nouvelle
    const current = await TypeLogementService.getById(id);
    if (current?.image) {
      const publicId = CloudinaryService.extractPublicId(current.image);
      if (publicId) {
        await CloudinaryService.deleteImage(publicId).catch(() => {
          // Échec silencieux : on continue même si la suppression échoue
        });
      }
    }

    const result = await CloudinaryService.uploadImage(req.file.buffer, "seek/types-logement", { maxDimension: 600, quality: 85 });
    imageUrl = result.url;
  }

  // Construire le payload de mise à jour avec les champs présents
  const updatePayload: Record<string, unknown> = {};
  if (req.body.nom !== undefined)   updatePayload.nom   = req.body.nom;
  if (req.body.actif !== undefined) updatePayload.actif = req.body.actif;
  if (req.body.ordre !== undefined && req.body.ordre !== "") {
    updatePayload.ordre = Number(req.body.ordre);
  }
  if (imageUrl !== undefined) updatePayload.image = imageUrl;

  const type = await TypeLogementService.update(id, updatePayload);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Type de logement mis à jour", data: type })
  );
};

// DELETE /api/types-logement/:id - admin
export const remove = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  // Récupérer l'image avant la suppression pour nettoyer Cloudinary
  const current = await TypeLogementService.getById(id);
  if (current?.image) {
    const publicId = CloudinaryService.extractPublicId(current.image);
    if (publicId) {
      await CloudinaryService.deleteImage(publicId).catch(() => {});
    }
  }

  await TypeLogementService.remove(id);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Type de logement supprimé" })
  );
};
