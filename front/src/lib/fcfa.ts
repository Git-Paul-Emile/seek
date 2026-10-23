// Formats monétaires de la charte « Écrire pour Seek » :
// espace insécable tous les 3 chiffres, « FCFA » jamais « XOF ».

const NARROW_NO_BREAK_SPACE = "\u202F";
export const NO_BREAK_SPACE = "\u00A0";
const MILLION = 1_000_000;

const groupThousands = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NO_BREAK_SPACE);

/** 1 500 000 (montant seul, pour les tableaux et chiffres clés). */
export const formatMontant = (value: number): string => groupThousands(value);

/** 1 500 000 FCFA */
export const formatFcfa = (value: number): string => `${groupThousands(value)}${NO_BREAK_SPACE}FCFA`;

/** Libellé de marqueur de carte : « 850 000 F », « 1,2 M F ». */
export const formatFcfaCourt = (value: number): string => {
  if (value >= MILLION) {
    const millions = (value / MILLION).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
    return `${millions}${NO_BREAK_SPACE}M${NO_BREAK_SPACE}F`;
  }
  return `${groupThousands(value)}${NO_BREAK_SPACE}F`;
};

/** Retire les espaces d'une saisie de montant et renvoie un entier, ou null. */
export const parseMontant = (input: string): number | null => {
  const digits = input.replace(/\D/g, "");
  return digits ? Number(digits) : null;
};

/** Met en forme une saisie de montant au fil de la frappe. */
export const formatSaisieMontant = (input: string): string => {
  const value = parseMontant(input);
  return value === null ? "" : groupThousands(value);
};

// Valeurs de `Bien.frequencePaiement` (voir FREQUENCES dans AddBien.tsx).
// « unique » (vente) n'affiche aucune fréquence.
const FREQUENCE_LIBELLES: Record<string, string> = {
  journalier: "jour",
  hebdomadaire: "semaine",
  mensuel: "mois",
  trimestriel: "trimestre",
  semestriel: "semestre",
  annuel: "an",
};

/** « mois » pour un loyer mensuel, null pour une vente ou une valeur inconnue. */
export const libelleFrequence = (frequence: string | null | undefined): string | null => {
  if (!frequence) return null;
  return FREQUENCE_LIBELLES[frequence.toLowerCase()] ?? null;
};
