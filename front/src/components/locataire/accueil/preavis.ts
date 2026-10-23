import { formatDateLongue } from "@/lib/dates";

// Fenêtre de préavis du locataire, partagée par « Mon bail » et la fenêtre de confirmation.

const JOURS_PAR_MOIS = 30;
const PREAVIS_MIN_JOURS = 30;
const PREAVIS_MAX_JOURS = 90;
const MS_PAR_JOUR = 86_400_000;

/** Fenêtre de préavis : de 3 mois à 1 mois avant la fin du bail, sans limite si la fin n'est pas fixée. */
export function verifierFenetrePreavis(dateFinBail?: string | null): { autorise: boolean; raison?: string } {
  if (!dateFinBail) return { autorise: true };
  const jours = Math.ceil((new Date(dateFinBail).getTime() - Date.now()) / MS_PAR_JOUR);
  if (jours < PREAVIS_MIN_JOURS) return { autorise: false, raison: "La fin du bail est dans moins d'un mois." };
  if (jours > PREAVIS_MAX_JOURS) {
    const ouverture = new Date(new Date(dateFinBail).getTime() - PREAVIS_MAX_JOURS * MS_PAR_JOUR);
    return { autorise: false, raison: `Préavis possible à partir du ${formatDateLongue(ouverture)}, 3 mois avant la fin du bail.` };
  }
  return { autorise: true };
}

export const DUREE_PREAVIS_MOIS = PREAVIS_MAX_JOURS / JOURS_PAR_MOIS;
