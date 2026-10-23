import * as Repo from "../repositories/typeLogementMeuble.repository.js";

export const getMeublesForTypeLogement = (typeLogementId: string) =>
  Repo.findByTypeLogement(typeLogementId);

export const getAllMeublesWithState = (typeLogementId: string) =>
  Repo.findAllMeublesWithState(typeLogementId);

export const setMeublesForTypeLogement = (typeLogementId: string, meubleIds: string[]) =>
  Repo.setMeubles(typeLogementId, meubleIds);
