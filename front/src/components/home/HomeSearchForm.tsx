import { useId, type ReactNode } from "react";
import { Building2, ChevronDown, MapPin, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useHomeSearch } from "@/hooks/useHomeSearch";
import { cn } from "@/lib/utils";

// Formulaire du hero (planches « Recherche et carte » et « Accueil ») : trois questions et un bouton.

type HomeSearch = ReturnType<typeof useHomeSearch>;

interface SearchFieldProps {
  label: string;
  icon: typeof Building2;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children: ReactNode;
  className?: string;
}

function SearchField({ label, icon: Icon, value, onChange, placeholder, children, className }: SearchFieldProps) {
  const id = useId();
  return (
    <div className={cn("relative flex min-w-0 items-center gap-3 px-4 py-3 lg:px-5", className)}>
      <Icon aria-hidden className="size-6 shrink-0 text-texte2 lg:hidden" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-overline font-semibold uppercase text-texte2">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-body-l font-medium focus:outline-none",
            value ? "text-encre" : "text-texte2",
          )}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
      </div>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-4 size-5 text-texte2 lg:hidden" />
    </div>
  );
}

export function HomeSearchForm({ search }: { search: HomeSearch }) {
  return (
    <form
      role="search"
      aria-label="Rechercher un logement"
      onSubmit={(event) => {
        event.preventDefault();
        search.submit();
      }}
      className="rounded-sheet bg-white p-2 shadow-float"
    >
      <div className="divide-y divide-filet lg:grid lg:grid-cols-[1fr_1.1fr_1fr] lg:divide-x lg:divide-y-0">
        <SearchField
          label="Type de logement"
          icon={Building2}
          value={search.typeLogement}
          onChange={search.setTypeLogement}
          placeholder="Tous les types"
        >
          {search.typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SearchField>
        <SearchField
          label="Ville ou quartier"
          icon={MapPin}
          value={search.lieu}
          onChange={search.setLieu}
          placeholder="Tout le Sénégal"
        >
          {search.lieuGroups.map((group) => (
            <optgroup key={group.ville} label={group.ville}>
              <option value={search.lieuValue(group.ville)}>{`Tout ${group.ville}`}</option>
              {group.quartiers.map((quartier) => (
                <option key={quartier} value={search.lieuValue(group.ville, quartier)}>
                  {`${quartier}, ${group.ville}`}
                </option>
              ))}
            </optgroup>
          ))}
        </SearchField>
        <SearchField
          label={search.budgetLabel}
          icon={Wallet}
          value={search.budgetMax}
          onChange={search.setBudgetMax}
          placeholder="Sans limite"
        >
          {search.budgetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SearchField>
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full">
        <Search aria-hidden />
        Rechercher
      </Button>
    </form>
  );
}
