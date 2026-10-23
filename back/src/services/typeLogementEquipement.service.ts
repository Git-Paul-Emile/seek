import * as Repo from "../repositories/typeLogementEquipement.repository.js";

export const getEquipementsForTypeLogement = (typeLogementId: string) =>
  Repo.findByTypeLogement(typeLogementId);

export const getAllEquipementsWithState = (typeLogementId: string) =>
  Repo.findAllEquipementsWithState(typeLogementId);

export const setEquipementsForTypeLogement = (typeLogementId: string, equipementIds: string[]) =>
  Repo.setEquipements(typeLogementId, equipementIds);
