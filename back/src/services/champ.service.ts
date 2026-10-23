import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as Repo from "../repositories/champ.repository.js";
import type { TypeChamp } from "../generated/prisma/enums.js";

export const getAll      = () => Repo.findAll();
export const getAllAdmin  = () => Repo.findAllAdmin();

export const create = async (data: {
  nom: string;
  type: TypeChamp;
  unite?: string | null;
  options?: string[];
  categorieId: string;
}) => {
  const existing = await Repo.findByNomAndCategorie(data.nom, data.categorieId);
  if (existing) throw new AppError(`"${data.nom}" existe déjà dans cette catégorie.`, StatusCodes.CONFLICT);
  return Repo.create(data);
};

export const update = async (
  id: string,
  data: Partial<{
    nom: string;
    type: TypeChamp;
    unite: string | null;
    options: string[];
    categorieId: string;
    actif: boolean;
  }>
) => {
  const existing = await Repo.findById(id);
  if (!existing) throw new AppError("Champ introuvable.", StatusCodes.NOT_FOUND);
  // Un champ "système" (cleSysteme renseigné) est mappé en dur à une colonne
  // statique de Bien (voir bienChampsAuthorization.service.ts) : changer son
  // type casserait ce mapping. Le nom et l'association par type de bien
  // restent modifiables normalement.
  if (existing.cleSysteme && data.type !== undefined && data.type !== existing.type) {
    throw new AppError(
      `"${existing.nom}" est un champ système : son type ne peut pas être modifié.`,
      StatusCodes.FORBIDDEN
    );
  }
  const nom = data.nom ?? existing.nom;
  const categorieId = data.categorieId ?? existing.categorieId;
  if (nom !== existing.nom || categorieId !== existing.categorieId) {
    const conflict = await Repo.findByNomAndCategorie(nom, categorieId);
    if (conflict && conflict.id !== id)
      throw new AppError(`"${nom}" existe déjà dans cette catégorie.`, StatusCodes.CONFLICT);
  }
  return Repo.update(id, data);
};

export const remove = async (id: string) => {
  const existing = await Repo.findById(id);
  if (!existing) throw new AppError("Champ introuvable.", StatusCodes.NOT_FOUND);
  if (existing.cleSysteme) {
    throw new AppError(
      `"${existing.nom}" est un champ système et ne peut pas être supprimé.`,
      StatusCodes.FORBIDDEN
    );
  }
  await Repo.remove(id);
};
