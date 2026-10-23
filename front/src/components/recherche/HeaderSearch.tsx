import { useEffect, useId, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { BUDGETS, LIEU_SEPARATOR, type TransactionChoice } from "@/hooks/useHomeSearch";
import { useLieux } from "@/hooks/useRecherche";
import { useRechercheFilters } from "@/hooks/useRechercheFilters";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { formatFcfa } from "@/lib/fcfa";

// Barre de recherche compacte de l'en-tête desktop (maquette « Recherche : liste et carte ») :
// type, où, budget. Les autres filtres actifs sont conservés.

function CompactField({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0 flex-1 px-5 py-1.5">
      <label htmlFor={id} className="block text-overline font-semibold uppercase text-texte2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer appearance-none truncate bg-transparent text-body-l text-encre focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}

export function HeaderSearch() {
  const filters = useRechercheFilters();
  const { data: types = [] } = useTypeLogements();
  const { data: lieux } = useLieux();

  const lieuFromUrl = () => {
    const ville = filters.get("ville");
    const quartier = filters.get("quartier");
    return quartier ? `${ville}${LIEU_SEPARATOR}${quartier}` : ville;
  };
  const [type, setType] = useState(filters.get("typeLogement"));
  const [lieu, setLieu] = useState(lieuFromUrl);
  const [budget, setBudget] = useState(filters.get("prixMax"));

  // Resynchronise les brouillons quand l'URL change (tiroir de filtres, retour arrière).
  useEffect(() => {
    setType(filters.get("typeLogement"));
    setLieu(lieuFromUrl());
    setBudget(filters.get("prixMax"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dépend uniquement de l'URL
  }, [filters.searchParams]);

  const transaction: TransactionChoice = filters.get("typeTransaction") === "vente" ? "vente" : "location";
  const villes = lieux?.villes ?? [];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const [ville = "", quartier = ""] = lieu.split(LIEU_SEPARATOR);
    filters.update({ typeLogement: type, ville, quartier, prixMax: budget, lat: null, lng: null, pointLabel: null, radius: null });
  };

  return (
    <form
      role="search"
      aria-label="Modifier la recherche"
      onSubmit={submit}
      className="flex max-w-[760px] items-center divide-x divide-filet rounded-full border border-filet bg-white py-1 pl-1 pr-1.5 shadow-card"
    >
      <CompactField label="Type" value={type} onChange={setType}>
        <option value="">Tous les types</option>
        {types.map((t) => (
          <option key={t.id} value={t.slug}>
            {t.nom}
          </option>
        ))}
      </CompactField>
      <CompactField label="Où" value={lieu} onChange={setLieu}>
        <option value="">Tout le Sénégal</option>
        {villes.map((ville) => (
          <optgroup key={ville} label={ville}>
            <option value={ville}>{`${ville} et alentours`}</option>
            {(lieux?.quartiers ?? [])
              .filter((q) => q.ville === ville)
              .map((q) => (
                <option key={q.nom} value={`${ville}${LIEU_SEPARATOR}${q.nom}`}>
                  {`${q.nom}, ${ville}`}
                </option>
              ))}
          </optgroup>
        ))}
      </CompactField>
      <CompactField label="Budget" value={budget} onChange={setBudget}>
        <option value="">Sans limite</option>
        {BUDGETS[transaction].map((value) => (
          <option key={value} value={String(value)}>
            {`≤ ${formatFcfa(value)}`}
          </option>
        ))}
      </CompactField>
      <div className="border-none pl-2">
        <button
          type="submit"
          aria-label="Rechercher"
          className="flex size-12 items-center justify-center rounded-full bg-baobab text-white transition-colors duration-hover hover:bg-baobab-900"
        >
          <Search aria-hidden className="size-5" />
        </button>
      </div>
    </form>
  );
}
