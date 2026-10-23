import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { useLieux } from "@/hooks/useRecherche";
import { formatFcfa } from "@/lib/fcfa";

export type TransactionChoice = "location" | "vente";

// Paliers de budget proposés : repères de saisie, pas des statistiques.
export const BUDGETS: Record<TransactionChoice, number[]> = {
  location: [100_000, 200_000, 400_000, 750_000, 1_500_000],
  vente: [25_000_000, 50_000_000, 100_000_000, 200_000_000, 500_000_000],
};

/** Valeur du champ « Où » : "ville" ou "ville|quartier". */
export const LIEU_SEPARATOR = "|";

export interface LieuGroup {
  ville: string;
  quartiers: string[];
}

/** Recherche de l'accueil : Louer ou Acheter, puis quoi, où, combien. */
export function useHomeSearch() {
  const navigate = useNavigate();
  const { data: typesLogement = [] } = useTypeLogements();
  const { data: lieux } = useLieux();

  const [transaction, setTransaction] = useState<TransactionChoice>("location");
  const [typeLogement, setTypeLogement] = useState("");
  const [lieu, setLieu] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  const lieuGroups = useMemo<LieuGroup[]>(
    () =>
      (lieux?.villes ?? []).map((ville) => ({
        ville,
        quartiers: (lieux?.quartiers ?? []).filter((q) => q.ville === ville).map((q) => q.nom),
      })),
    [lieux],
  );

  const budgetOptions = BUDGETS[transaction].map((value) => ({
    value: String(value),
    label: `Jusqu'à ${formatFcfa(value)}`,
  }));

  const changeTransaction = (next: TransactionChoice) => {
    setTransaction(next);
    setBudgetMax("");
  };

  const submit = () => {
    const params = new URLSearchParams({ typeTransaction: transaction });
    if (typeLogement) params.set("typeLogement", typeLogement);
    if (lieu) {
      const [ville, quartier] = lieu.split(LIEU_SEPARATOR);
      params.set("ville", ville);
      if (quartier) params.set("quartier", quartier);
    }
    if (budgetMax) params.set("prixMax", budgetMax);
    navigate(`/annonces?${params.toString()}`);
  };

  return {
    transaction,
    changeTransaction,
    typeLogement,
    setTypeLogement,
    typeOptions: typesLogement.map((t) => ({ value: t.slug, label: t.nom })),
    lieu,
    setLieu,
    lieuGroups,
    lieuValue: (ville: string, quartier?: string) => (quartier ? `${ville}${LIEU_SEPARATOR}${quartier}` : ville),
    budgetMax,
    setBudgetMax,
    budgetOptions,
    budgetLabel: transaction === "location" ? "Budget par mois" : "Budget",
    // Villes classées par nombre de quartiers ayant des annonces publiées : les plus couvertes d'abord.
    villesCouvertes: [...lieuGroups].sort((a, b) => b.quartiers.length - a.quartiers.length).map((g) => g.ville),
    submit,
  };
}
