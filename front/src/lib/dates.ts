import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";

// Dates de la charte « Écrire pour Seek » : en toutes lettres dans le texte (1er novembre 2026).

/** « 1er novembre 2026 », « 5 novembre 2026 ». */
export const formatDateLongue = (date: string | Date): string => {
  const valeur = new Date(date);
  const jour = valeur.getDate() === 1 ? "1er" : String(valeur.getDate());
  return `${jour} ${format(valeur, "MMMM yyyy", { locale: fr })}`;
};

/** « il y a 3 jours ». */
export const formatIlYA = (date: string | Date): string =>
  formatDistanceToNowStrict(new Date(date), { locale: fr, addSuffix: true });
