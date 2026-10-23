import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";
import { uploadFile, extractPublicId, deleteImage } from "../services/cloudinary.service.js";

const ALLOWED_TYPES = ["ACTE_PROPRIETE", "PLAN_CADASTRAL", "PERMIS_CONSTRUIRE", "AUTRE"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

// GET /api/biens/:bienId/documents
export const listDocuments = async (req: Request, res: Response): Promise<void> => {
  const bienId = req.params.bienId as string;
  const proprietaireId = req.owner!.id;

  const bien = await prisma.bien.findFirst({ where: { id: bienId, proprietaireId } });
  if (!bien) throw new AppError("Bien introuvable ou non autorisé", StatusCodes.NOT_FOUND);

  const documents = await prisma.documentBien.findMany({
    where: { bienId, proprietaireId },
    orderBy: { createdAt: "desc" },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Documents récupérés", data: documents })
  );
};

// POST /api/biens/:bienId/documents
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const bienId = req.params.bienId as string;
  const proprietaireId = req.owner!.id;
  const file = req.file;
  const { type } = req.body;
  const nom = (req.body.nom as string | undefined) || file?.originalname || "document";

  if (!file) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Fichier requis" }));
    return;
  }
  if (!type) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Type requis" }));
    return;
  }
  if (!ALLOWED_TYPES.includes(type)) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Type de document invalide" }));
    return;
  }
  if (file.mimetype !== "application/pdf") {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Seuls les fichiers PDF sont acceptés" }));
    return;
  }
  if (file.size > MAX_SIZE) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Fichier trop volumineux (max 10 Mo)" }));
    return;
  }

  const bien = await prisma.bien.findFirst({ where: { id: bienId, proprietaireId } });
  if (!bien) throw new AppError("Bien introuvable ou non autorisé", StatusCodes.NOT_FOUND);

  const { url } = await uploadFile(file.buffer, `seek/documents/${bienId}`);

  const doc = await prisma.documentBien.create({
    data: { bienId, proprietaireId, nom, type, url, taille: file.size },
  });

  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Document uploadé", data: doc })
  );
};

// DELETE /api/biens/:bienId/documents/:docId
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const bienId = req.params.bienId as string;
  const docId = req.params.docId as string;
  const proprietaireId = req.owner!.id;

  const doc = await prisma.documentBien.findFirst({ where: { id: docId, bienId, proprietaireId } });
  if (!doc) throw new AppError("Document introuvable ou non autorisé", StatusCodes.NOT_FOUND);

  const publicId = extractPublicId(doc.url);
  if (publicId) {
    try { await deleteImage(publicId); } catch { /* ignore */ }
  }

  await prisma.documentBien.delete({ where: { id: docId } });
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Document supprimé" }));
};
