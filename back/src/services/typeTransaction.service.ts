import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as Repo from "../repositories/typeTransaction.repository.js";
import type { TypeTransaction } from "../generated/prisma/client.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSlug = (nom: string): string =>
  nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// ─── Lecture ──────────────────────────────────────────────────────────────────

export const getAll = (): Promise<TypeTransaction[]> => Repo.findAll();

export const getAllAdmin = (): Promise<TypeTransaction[]> => Repo.findAllAdmin();

export const getById = (id: string): Promise<TypeTransaction | null> => Repo.findById(id);

// ─── Création ─────────────────────────────────────────────────────────────────

export const create = async (data: {
  nom: string;
  ordre?: number;
}): Promise<TypeTransaction> => {
  const slug = toSlug(data.nom);

  const existing = await Repo.findBySlug(slug);
  if (existing) {
    throw new AppError(
      `Un type de transaction avec le nom "${data.nom}" existe déjà.`,
      StatusCodes.CONFLICT
    );
  }

  return Repo.create({ ...data, slug });
};

// ─── Mise à jour ──────────────────────────────────────────────────────────────

export const update = async (
  id: string,
  data: Partial<{ nom: string; actif: boolean; ordre: number }>
): Promise<TypeTransaction> => {
  const existing = await Repo.findById(id);
  if (!existing) {
    throw new AppError("Type de transaction introuvable.", StatusCodes.NOT_FOUND);
  }

  const updateData: Parameters<typeof Repo.update>[1] = { ...data };

  if (data.nom && data.nom !== existing.nom) {
    const newSlug = toSlug(data.nom);
    const conflict = await Repo.findBySlug(newSlug);
    if (conflict && conflict.id !== id) {
      throw new AppError(
        `Un type de transaction avec le nom "${data.nom}" existe déjà.`,
        StatusCodes.CONFLICT
      );
    }
    updateData.slug = newSlug;
  }

  if (data.ordre !== undefined && data.ordre !== existing.ordre) {
    const occupant = await Repo.findByOrdre(data.ordre);
    if (occupant && occupant.id !== id) {
      await Repo.update(occupant.id, { ordre: existing.ordre });
    }
  }

  return Repo.update(id, updateData);
};

// ─── Suppression ──────────────────────────────────────────────────────────────

export const remove = async (id: string): Promise<void> => {
  const existing = await Repo.findById(id);
  if (!existing) {
    throw new AppError("Type de transaction introuvable.", StatusCodes.NOT_FOUND);
  }
  await Repo.remove(id);
};
