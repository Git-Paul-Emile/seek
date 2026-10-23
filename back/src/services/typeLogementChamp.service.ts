import * as Repo from "../repositories/typeLogementChamp.repository.js";

export const getChampsForTypeLogement = (typeLogementId: string) =>
  Repo.findByTypeLogement(typeLogementId);

export const getAllChampsWithState = (typeLogementId: string) =>
  Repo.findAllChampsWithState(typeLogementId);

export const setChampsForTypeLogement = (
  typeLogementId: string,
  items: { champId: string; obligatoire: boolean; ordre: number }[]
) => Repo.setChamps(typeLogementId, items);
