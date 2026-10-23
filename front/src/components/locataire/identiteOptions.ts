import type { TypePieceIdentite } from "@/api/locataire";

// Listes de l'identité du locataire, partagées par l'activation du compte et le profil.

export const TYPES_PIECE: { value: TypePieceIdentite; label: string }[] = [
  { value: "CNI", label: "Carte nationale d'identité" },
  { value: "PASSEPORT", label: "Passeport" },
  { value: "CARTE_CONSULAIRE", label: "Carte consulaire" },
  { value: "AUTRE", label: "Autre" },
];

export const SITUATIONS_PROFESSIONNELLES = [
  { value: "Employé", label: "Employé" },
  { value: "Indépendant", label: "Indépendant ou freelance" },
  { value: "Entrepreneur", label: "Entrepreneur" },
  { value: "Étudiant", label: "Étudiant" },
  { value: "Sans emploi", label: "Sans emploi" },
  { value: "Retraité", label: "Retraité" },
  { value: "Autre", label: "Autre" },
];

export const SEXES = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
];

/** Ramène les anciennes saisies (« Homme », « Féminin »…) à la lettre attendue par le back. */
export const normaliserSexe = (sexe?: string | null): "M" | "F" | "" => {
  const valeur = sexe?.trim().toUpperCase() ?? "";
  if (valeur === "M" || valeur.startsWith("MASC") || valeur === "HOMME") return "M";
  if (valeur === "F" || valeur.startsWith("FEM") || valeur.startsWith("FÉM") || valeur === "FEMME") return "F";
  return "";
};
