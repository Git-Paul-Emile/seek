import type { Bien } from "@/api/bien";
import { libelleFrequence } from "@/lib/fcfa";

// Lignes du comparateur : ce que l'on compare et dans quel sens une valeur est meilleure.

export type TypeLigne = "texte" | "nombre" | "prix" | "oui-non" | "date";
export type Valeur = string | number | boolean | null;

export interface LigneComparaison {
  libelle: string;
  type: TypeLigne;
  unite?: string;
  /** Sens de comparaison : la valeur la plus haute ou la plus basse est mise en avant. */
  meilleur?: "plus-haut" | "plus-bas";
  valeur: (bien: Bien) => Valeur;
}

export const SECTIONS_COMPARAISON: { titre: string; lignes: LigneComparaison[] }[] = [
  {
    titre: "Prix",
    lignes: [
      { libelle: "Prix", type: "prix", meilleur: "plus-bas", valeur: (b) => b.prix },
      {
        libelle: "Fréquence",
        type: "texte",
        valeur: (b) => {
          const frequence = libelleFrequence(b.frequencePaiement);
          if (frequence) return `par ${frequence}`;
          return b.frequencePaiement ? "Paiement unique" : null;
        },
      },
      { libelle: "Caution", type: "prix", meilleur: "plus-bas", valeur: (b) => b.caution },
      { libelle: "Charges incluses", type: "oui-non", valeur: (b) => b.chargesIncluses },
    ],
  },
  {
    titre: "Surface et pièces",
    lignes: [
      { libelle: "Surface", type: "nombre", unite: "m²", meilleur: "plus-haut", valeur: (b) => b.surface },
      { libelle: "Chambres", type: "nombre", meilleur: "plus-haut", valeur: (b) => b.nbChambres },
      { libelle: "Salles de bain", type: "nombre", meilleur: "plus-haut", valeur: (b) => b.nbSdb },
      { libelle: "Salons", type: "nombre", meilleur: "plus-haut", valeur: (b) => b.nbSalons },
      { libelle: "Cuisines", type: "nombre", valeur: (b) => b.nbCuisines },
      { libelle: "Toilettes", type: "nombre", valeur: (b) => b.nbWc },
      {
        libelle: "Étage",
        type: "texte",
        valeur: (b) => (b.etage === null ? null : b.nbEtages ? `${b.etage} sur ${b.nbEtages}` : String(b.etage)),
      },
    ],
  },
  {
    titre: "Localisation",
    lignes: [
      { libelle: "Ville", type: "texte", valeur: (b) => b.ville },
      { libelle: "Quartier", type: "texte", valeur: (b) => b.quartier },
    ],
  },
  {
    titre: "Options",
    lignes: [
      { libelle: "Meublé", type: "oui-non", valeur: (b) => b.meuble },
      { libelle: "Parking", type: "oui-non", valeur: (b) => b.parking },
      { libelle: "Ascenseur", type: "oui-non", valeur: (b) => b.ascenseur },
      { libelle: "Animaux acceptés", type: "oui-non", valeur: (b) => b.animaux },
      { libelle: "Fumeurs acceptés", type: "oui-non", valeur: (b) => b.fumeurs },
    ],
  },
  {
    titre: "Annonce",
    lignes: [
      { libelle: "Disponible le", type: "date", valeur: (b) => b.disponibleLe },
      { libelle: "Publiée le", type: "date", valeur: (b) => b.publishedAt ?? null },
      { libelle: "Vues", type: "nombre", valeur: (b) => b.nbVues ?? null },
    ],
  },
];

/** Index des biens dont la valeur est la meilleure, quand il y a vraiment une différence. */
export function meilleursIndex(ligne: LigneComparaison, valeurs: Valeur[]): Set<number> {
  if (!ligne.meilleur) return new Set();
  const nombres = valeurs.map((v) => (typeof v === "number" ? v : null));
  const presents = nombres.filter((n): n is number => n !== null);
  if (presents.length < 2 || Math.min(...presents) === Math.max(...presents)) return new Set();
  const cible = ligne.meilleur === "plus-haut" ? Math.max(...presents) : Math.min(...presents);
  return new Set(nombres.flatMap((n, i) => (n === cible ? [i] : [])));
}

/** Vrai si au moins deux biens ont une valeur et qu'elles diffèrent. */
export function ligneDifferente(valeurs: Valeur[]): boolean {
  const presentes = valeurs.filter((v) => v !== null).map(String);
  return presentes.length > 1 && new Set(presentes).size > 1;
}
