import type { BailResume } from "@/api/locataire";

// Un bail en préavis ou en renouvellement court toujours : le locataire garde son espace
// complet (loyers, déclaration de paiement, contrat, propriétaire). Même liste que
// STATUTS_BAIL_EN_COURS côté back (bail.service.ts).

export const STATUTS_BAIL_EN_COURS: BailResume["statut"][] = ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"];

const STATUTS_EN_COURS_TEXTE: readonly string[] = STATUTS_BAIL_EN_COURS;

/** Accepte aussi les statuts reçus en texte libre (historique des baux). */
export const estStatutEnCours = (statut: string) => STATUTS_EN_COURS_TEXTE.includes(statut);

export const estBailEnCours = (bail: Pick<BailResume, "statut">) => estStatutEnCours(bail.statut);

/** Le bail en cours du locataire, s'il en a un. */
export const trouverBailEnCours = (bails: BailResume[] | undefined) => bails?.find(estBailEnCours);
