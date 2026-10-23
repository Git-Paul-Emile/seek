// Couleurs de la charte Seek en RVB pour jsPDF (reçus, quittances, relances).
// Mêmes valeurs que les tokens Tailwind de tailwind.config.ts.

export type Rvb = [number, number, number];

export const PDF_COULEURS = {
  baobab: [10, 92, 67] as Rvb,
  soleil: [255, 194, 51] as Rvb,
  soleil100: [255, 241, 204] as Rvb,
  encre: [12, 31, 24] as Rvb,
  texte2: [75, 91, 85] as Rvb,
  bordChamp: [127, 144, 138] as Rvb,
  filet: [220, 228, 224] as Rvb,
  surface: [243, 247, 245] as Rvb,
  blanc: [255, 255, 255] as Rvb,
};
