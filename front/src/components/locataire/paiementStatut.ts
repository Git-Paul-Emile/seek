import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Echeance, StatutPaiement } from "@/api/bail";
import type { StatusTone } from "@/components/ui/StatusBadge";

// Statuts d'une échéance vus par le locataire : un mot et une icône (planche « Statuts »).

export const STATUT_PAIEMENT: Record<StatutPaiement, { label: string; tone: StatusTone }> = {
  PAYE: { label: "Payé", tone: "positif" },
  EN_ATTENTE_CONFIRMATION: { label: "À confirmer", tone: "attente" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  EN_RETARD: { label: "En retard", tone: "alerte" },
  A_VENIR: { label: "À venir", tone: "neutre" },
  ANNULE: { label: "Annulé", tone: "arret" },
};

/** Une échéance reste à régler tant qu'elle n'est ni payée, ni annulée, ni déclarée. */
export const resteARegler = (echeance: Echeance) =>
  echeance.statut !== "PAYE" && echeance.statut !== "ANNULE" && echeance.statut !== "EN_ATTENTE_CONFIRMATION";

const parDateCroissante = (a: Echeance, b: Echeance) =>
  new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime();

/** Échéances à régler, de la plus ancienne à la plus récente. */
export const echeancesARegler = (echeancier: Echeance[]) => echeancier.filter(resteARegler).sort(parDateCroissante);

/** « Octobre 2026 ». */
export const libelleMois = (date: string) => {
  const mois = format(new Date(date), "MMMM yyyy", { locale: fr });
  return mois.charAt(0).toUpperCase() + mois.slice(1);
};

/** « octobre », pour les phrases (« Octobre payé le 3 octobre »). */
export const nomMois = (date: string) => format(new Date(date), "MMMM", { locale: fr });

/** « 5 novembre », sans l'année, pour les échéances proches. */
export const jourMois = (date: string) => {
  const valeur = new Date(date);
  const jour = valeur.getDate() === 1 ? "1er" : String(valeur.getDate());
  return `${jour} ${format(valeur, "MMMM", { locale: fr })}`;
};

const MS_PAR_JOUR = 86_400_000;

/** Nombre de jours entiers entre aujourd'hui et la date (négatif si dépassée). */
export const joursAvant = (date: string) => {
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  const cible = new Date(date);
  cible.setHours(0, 0, 0, 0);
  return Math.round((cible.getTime() - aujourdHui.getTime()) / MS_PAR_JOUR);
};
