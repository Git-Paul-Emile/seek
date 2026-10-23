import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as Repo from "../repositories/meuble.repository.js";

export const getAll      = () => Repo.findAll();
export const getAllAdmin  = () => Repo.findAllAdmin();

export const createMany = async (items: { nom: string; categorieId: string }[]) => {
  const checks = await Promise.all(
    items.map((item) => Repo.findByNomAndCategorie(item.nom, item.categorieId))
  );
  const duplicates = items
    .filter((_, i) => checks[i] !== null)
    .map((item) => `"${item.nom}"`);
  if (duplicates.length > 0) {
    throw new AppError(
      `Déjà existant${duplicates.length > 1 ? "s" : ""} : ${duplicates.join(", ")}`,
      StatusCodes.CONFLICT
    );
  }
  return Repo.createMany(items);
};

export const update = async (
  id: string,
  data: Partial<{ nom: string; categorieId: string; actif: boolean }>
) => {
  const existing = await Repo.findById(id);
  if (!existing) throw new AppError("Meuble introuvable.", StatusCodes.NOT_FOUND);

  const nom         = data.nom         ?? existing.nom;
  const categorieId = data.categorieId ?? existing.categorieId;
  if (nom !== existing.nom || categorieId !== existing.categorieId) {
    const conflict = await Repo.findByNomAndCategorie(nom, categorieId);
    if (conflict && conflict.id !== id) {
      throw new AppError(`"${nom}" dans cette catégorie existe déjà.`, StatusCodes.CONFLICT);
    }
  }

  return Repo.update(id, data);
};

export const remove = async (id: string): Promise<void> => {
  const existing = await Repo.findById(id);
  if (!existing) throw new AppError("Meuble introuvable.", StatusCodes.NOT_FOUND);
  await Repo.remove(id);
};
