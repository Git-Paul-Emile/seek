import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Bien, StatutAnnonce } from "@/api/bien";
import { useBiens } from "@/hooks/useBien";

// Filtres de « Mes biens » : le filtre actif vit dans l'URL (?filtre=…) pour être
// partageable et ouvert directement depuis le tableau de bord.

export type FiltreBiens = "TOUS" | "ASSOCIE" | "NON_ASSOCIE" | "MIS_EN_AVANT" | StatutAnnonce;

export const FILTRES_BIENS: { valeur: FiltreBiens; label: string; test: (b: Bien) => boolean }[] = [
  { valeur: "TOUS", label: "Tous", test: () => true },
  { valeur: "ASSOCIE", label: "Occupés", test: (b) => Boolean(b.hasBailActif) },
  { valeur: "NON_ASSOCIE", label: "Sans locataire", test: (b) => !b.hasBailActif },
  { valeur: "MIS_EN_AVANT", label: "Mis en avant", test: (b) => Boolean(b.estMisEnAvant) },
  { valeur: "BROUILLON", label: "Brouillons", test: (b) => b.statutAnnonce === "BROUILLON" },
  { valeur: "EN_ATTENTE", label: "En attente", test: (b) => b.statutAnnonce === "EN_ATTENTE" },
  { valeur: "PUBLIE", label: "Publiées", test: (b) => b.statutAnnonce === "PUBLIE" },
  { valeur: "REJETE", label: "Rejetées", test: (b) => b.statutAnnonce === "REJETE" },
];

const PARAM_FILTRE = "filtre";

const correspondRecherche = (bien: Bien, recherche: string) =>
  [bien.titre, bien.ville, bien.region, bien.quartier, bien.pays, bien.typeLogement?.nom].some((valeur) =>
    valeur?.toLowerCase().includes(recherche),
  );

export function useListeBiens() {
  const { data: biens = [], isLoading } = useBiens();
  const [params, setParams] = useSearchParams();
  const [recherche, setRecherche] = useState("");

  const filtreParam = params.get(PARAM_FILTRE);
  const filtre: FiltreBiens = FILTRES_BIENS.find((f) => f.valeur === filtreParam)?.valeur ?? "TOUS";

  const setFiltre = (valeur: FiltreBiens) => {
    const suivants = new URLSearchParams(params);
    if (valeur === "TOUS") suivants.delete(PARAM_FILTRE);
    else suivants.set(PARAM_FILTRE, valeur);
    setParams(suivants, { replace: true });
  };

  const compteurs = useMemo(
    () => Object.fromEntries(FILTRES_BIENS.map((f) => [f.valeur, biens.filter(f.test).length])) as Record<FiltreBiens, number>,
    [biens],
  );

  const biensAffiches = useMemo(() => {
    const test = FILTRES_BIENS.find((f) => f.valeur === filtre)?.test ?? (() => true);
    const terme = recherche.trim().toLowerCase();
    return biens.filter((b) => test(b) && (!terme || correspondRecherche(b, terme)));
  }, [biens, filtre, recherche]);

  return { biens, biensAffiches, isLoading, filtre, setFiltre, compteurs, recherche, setRecherche };
}
