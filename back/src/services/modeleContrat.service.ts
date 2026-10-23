import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as ModeleContratRepo from "../repositories/modeleContrat.repository.js";

// ─── List (admin) ─────────────────────────────────────────────────────────────

export const getAll = async (params: {
  page: number;
  limit: number;
  typeBail?: string;
  actif?: boolean;
}) => {
  const { items, total } = await ModeleContratRepo.findMany(params);
  const totalPages = Math.ceil(total / params.limit);
  return {
    items,
    meta: { total, page: params.page, limit: params.limit, totalPages },
  };
};

// ─── Liste publique (owner: choisir un modèle) ───────────────────────────────

export const getActifs = async (typeBail?: string) => {
  return ModeleContratRepo.findActifs(typeBail);
};

// ─── Create ──────────────────────────────────────────────────────────────────

export const create = async (data: {
  titre: string;
  typeBail?: string | null;
  contenu: string;
  actif?: boolean;
  ordre?: number;
}) => {
  return ModeleContratRepo.create(data);
};

// ─── Update ──────────────────────────────────────────────────────────────────

export const update = async (
  id: string,
  data: {
    titre?: string;
    typeBail?: string | null;
    contenu?: string;
    actif?: boolean;
    ordre?: number;
  }
) => {
  const modele = await ModeleContratRepo.findById(id);
  if (!modele) throw new AppError("Modèle de contrat introuvable", StatusCodes.NOT_FOUND);
  return ModeleContratRepo.update(id, data);
};

// ─── Delete ──────────────────────────────────────────────────────────────────

export const remove = async (id: string) => {
  const modele = await ModeleContratRepo.findById(id);
  if (!modele) throw new AppError("Modèle de contrat introuvable", StatusCodes.NOT_FOUND);

  const linked = await ModeleContratRepo.countContrats(id);
  if (linked > 0)
    throw new AppError(
      "Ce modèle est utilisé par des contrats existants. Désactivez-le plutôt que de le supprimer.",
      StatusCodes.CONFLICT
    );

  return ModeleContratRepo.remove(id);
};
