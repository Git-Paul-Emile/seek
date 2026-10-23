import type { Bien, StatutAnnonce } from "@/api/bien";
import type { StatutPaiement } from "@/api/bail";
import type { StatusTone } from "@/components/ui/StatusBadge";

// Libellés de statut de l'espace propriétaire, dans le vocabulaire de la charte.

export const STATUT_ANNONCE: Record<StatutAnnonce, { tone: StatusTone; label: string; court: string }> = {
  BROUILLON: { tone: "neutre", label: "Brouillon", court: "brouillon" },
  EN_ATTENTE: { tone: "attente", label: "En attente", court: "en attente" },
  PUBLIE: { tone: "positif", label: "Publiée", court: "publiée" },
  REJETE: { tone: "arret", label: "Rejetée", court: "rejetée" },
  ANNULE: { tone: "arret", label: "Retirée", court: "retirée" },
};

const STATUT_BIEN_TRAVAUX = "en-maintenance";

/** « Occupé », « Libre · publiée », « En travaux ». */
export const libelleOccupation = (bien: Pick<Bien, "hasBailActif" | "statutBien" | "statutAnnonce">): string => {
  if (bien.hasBailActif) return "Occupé";
  if (bien.statutBien?.slug === STATUT_BIEN_TRAVAUX) return "En travaux";
  return `Libre · ${STATUT_ANNONCE[bien.statutAnnonce]?.court ?? ""}`.trim();
};

/** Badge du loyer du mois en cours. Sans échéance ce mois-ci : « Aucun loyer ». */
export const badgeLoyerDuMois = (
  statut: StatutPaiement | undefined,
  joursRetard: number | undefined,
): { tone: StatusTone; label: string } => {
  switch (statut) {
    case "PAYE":
      return { tone: "positif", label: "Payé" };
    case "EN_RETARD":
      return { tone: "alerte", label: joursRetard === undefined ? "En retard" : `En retard · ${joursRetard} j` };
    case "EN_ATTENTE_CONFIRMATION":
      return { tone: "attente", label: "À confirmer" };
    case "EN_ATTENTE":
    case "A_VENIR":
      return { tone: "attente", label: "À venir" };
    default:
      return { tone: "neutre", label: "Aucun loyer" };
  }
};
