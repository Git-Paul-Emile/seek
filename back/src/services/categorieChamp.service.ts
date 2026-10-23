import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as Repo from "../repositories/categorieChamp.repository.js";

export const getAll = () => Repo.findAll();

export const create = async (data: { nom: string; ordre?: number }) => {
  const existing = await Repo.findByNom(data.nom);
  if (existing) throw new AppError(`"${data.nom}" existe déjà.`, StatusCodes.CONFLICT);
  return Repo.create(data);
};

export const update = async (id: string, data: Partial<{ nom: string; ordre: number }>) => {
  const existing = await Repo.findById(id);
  if (!existing) throw new AppError("Catégorie introuvable.", StatusCodes.NOT_FOUND);
  if (data.nom && data.nom !== existing.nom) {
    const conflict = await Repo.findByNom(data.nom);
    if (conflict) throw new AppError(`"${data.nom}" existe déjà.`, StatusCodes.CONFLICT);
  }
  return Repo.update(id, data);
};

export const remove = async (id: string) => {
  const existing = await Repo.findById(id);
  if (!existing) throw new AppError("Catégorie introuvable.", StatusCodes.NOT_FOUND);
  if (existing.champs.length > 0)
    throw new AppError("Impossible de supprimer une catégorie contenant des champs.", StatusCodes.CONFLICT);
  await Repo.remove(id);
};
