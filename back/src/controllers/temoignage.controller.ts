import type { Response, Request } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { emitTemoignageSubmitted } from "../services/socket.service.js";

const prisma = new PrismaClient();

export const getAllActifs = async (_req: Request, res: Response) => {
  const temoignages = await prisma.temoignage.findMany({
    where: { actif: true },
    orderBy: { ordre: "asc" },
    select: {
      id: true,
      nom: true,
      profession: true,
      temoignage: true,
    },
  });

  res.json({ data: temoignages });
};

export const create = async (req: Request, res: Response) => {
  const { nom, profession, temoignage } = req.body;

  if (!nom || !temoignage) {
    return res.status(400).json({ error: "Nom et témoignage sont requis" });
  }

  const newTemoignage = await prisma.temoignage.create({
    data: {
      nom,
      profession,
      temoignage,
      actif: false, // Par défaut inactif, à approuver par admin
    },
  });

  emitTemoignageSubmitted();

  res.status(201).json({ data: newTemoignage });
};

export const getAll = async (_req: Request, res: Response) => {
  const temoignages = await prisma.temoignage.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: temoignages });
};

export const update = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { nom, profession, temoignage, actif, ordre } = req.body;

  const updatedTemoignage = await prisma.temoignage.update({
    where: { id },
    data: {
      nom,
      profession,
      temoignage,
      actif,
      ordre,
    },
  });

  res.json({ data: updatedTemoignage });
};

export const deleteOne = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  await prisma.temoignage.delete({
    where: { id },
  });

  res.status(204).send();
};
