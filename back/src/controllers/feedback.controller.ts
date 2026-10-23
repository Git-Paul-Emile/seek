import type { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { emitFeedbackSubmitted } from "../services/socket.service.js";

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  const { experience, facilite, apprecie, frustration } = req.body;

  const feedback = await prisma.feedback.create({
    data: {
      experience: experience ? Number(experience) : null,
      facilite:   facilite   ? Number(facilite)   : null,
      apprecie:   apprecie   || null,
      frustration: frustration || null,
    },
  });

  emitFeedbackSubmitted();

  res.status(201).json({ data: feedback });
};

export const getAll = async (_req: Request, res: Response) => {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  const total = feedbacks.length;

  const withExp = feedbacks.filter((f) => f.experience !== null);
  const avgExperience =
    withExp.length > 0
      ? withExp.reduce((s: number, f) => s + (f.experience ?? 0), 0) / withExp.length
      : 0;

  const withFac = feedbacks.filter((f) => f.facilite !== null);
  const avgFacilite =
    withFac.length > 0
      ? withFac.reduce((s: number, f) => s + (f.facilite ?? 0), 0) / withFac.length
      : 0;

  res.json({ data: feedbacks, meta: { total, avgExperience, avgFacilite } });
};

export const markAllRead = async (_req: Request, res: Response) => {
  await prisma.feedback.updateMany({ where: { lu: false }, data: { lu: true } });
  res.status(204).send();
};

export const deleteOne = async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  await prisma.feedback.delete({ where: { id } });
  res.status(204).send();
};
