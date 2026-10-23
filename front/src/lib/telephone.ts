// Numéros sénégalais, format de la charte : +221 77 123 45 67.

export const SENEGAL_PREFIX = "+221";
export const SENEGAL_DIGITS = 9;

/** Garde les chiffres saisis (sans l'indicatif) et les groupe « 77 123 45 67 ». */
export const formatNumeroSenegal = (input: string): string => {
  const digits = input.replace(/\D/g, "").replace(/^221/, "").slice(0, SENEGAL_DIGITS);
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return groups.filter(Boolean).join(" ");
};

/** Numéro international attendu par l'API : +221771234567, ou null si incomplet. */
export const numeroInternational = (saisie: string): string | null => {
  const digits = saisie.replace(/\D/g, "");
  return digits.length === SENEGAL_DIGITS ? `${SENEGAL_PREFIX}${digits}` : null;
};
