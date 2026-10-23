import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Loader2, Search } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Tableau de données de la charte (planche 25) : dense et lisible, en-têtes en capitales,
// lignes de 56 px, montants alignés à droite, puces de statut avec compteur.

type Alignement = "gauche" | "droite" | "centre";

const ALIGN: Record<Alignement, string> = { gauche: "text-left", droite: "text-right", centre: "text-center" };

/** En-tête de page admin : titre, phrase d'aide et actions. Grille, jamais flex-between (CSS mobile global). */
export function EnTeteAdmin({
  titre,
  description,
  actions,
  retour,
}: {
  titre: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Page parente, pour les pages de détail : « ‹ Types de logement ». */
  retour?: { to: string; label: string };
}) {
  return (
    <header className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="min-w-0">
        {retour && (
          <Link to={retour.to} className="mb-2 inline-flex min-h-10 items-center gap-1 text-body-m font-semibold text-baobab hover:underline">
            <ChevronLeft aria-hidden className="size-4" />
            {retour.label}
          </Link>
        )}
        <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">{titre}</h1>
        {description && <p className="mt-1 text-body-l text-texte2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

/** Champ de recherche de la barre de filtres. */
export function RechercheAdmin({ value, onChange, placeholder, label }: { value: string; onChange: (valeur: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texte2" />
      <Input type="search" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-12" />
    </div>
  );
}

export interface FiltreOption<T extends string> {
  valeur: T;
  label: string;
  compteur?: number | null;
}

/** Puces de filtre par statut, avec compteur (« En attente · 14 »). */
export function FiltresStatut<T extends string>({
  options,
  valeur,
  onChange,
  label,
  apres,
}: {
  options: FiltreOption<T>[];
  valeur: T;
  onChange: (valeur: T) => void;
  label: string;
  /** Puce supplémentaire en fin de rangée (lien vers une autre file, par exemple). */
  apres?: ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((option) => (
        <Chip key={option.valeur} selected={valeur === option.valeur} onClick={() => onChange(option.valeur)}>
          {option.compteur ? `${option.label} · ${option.compteur}` : option.label}
        </Chip>
      ))}
      {apres}
    </div>
  );
}

export function Tableau({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-card border border-filet bg-white", className)}>
      <table aria-label={label} className="w-full border-collapse text-body-m">
        {children}
      </table>
    </div>
  );
}

export function TeteTableau({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, alignement = "gauche", className, ...props }: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & { alignement?: Alignement }) {
  return (
    <th scope="col" className={cn("h-12 whitespace-nowrap px-3 text-overline font-semibold uppercase text-texte2", ALIGN[alignement], className)} {...props}>
      {children}
    </th>
  );
}

export function Tr({ children, selectionne = false, className, onClick }: { children: ReactNode; selectionne?: boolean; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "h-14 border-t border-filet transition-colors duration-hover",
        selectionne ? "bg-baobab-100" : "hover:bg-surface/60",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ children, alignement = "gauche", montant = false, className, ...props }: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & { alignement?: Alignement; montant?: boolean }) {
  return (
    <td
      className={cn("px-3 py-3 align-middle text-encre", ALIGN[montant ? "droite" : alignement], montant && "whitespace-nowrap font-semibold tabular-nums", className)}
      {...props}
    >
      {children}
    </td>
  );
}

/** Case à cocher de sélection multiple. */
export function CaseSelection({
  checked,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  indeterminate?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(element) => {
        if (element) element.indeterminate = indeterminate;
      }}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.checked)}
      className="size-5 cursor-pointer rounded-marker accent-baobab disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

/** Ligne vide, chargement ou message dans le corps du tableau. */
export function LigneMessage({ colonnes, children }: { colonnes: number; children: ReactNode }) {
  return (
    <tr className="border-t border-filet">
      <td colSpan={colonnes} className="px-4 py-12 text-center text-body-m text-texte2">
        {children}
      </td>
    </tr>
  );
}

/** Roue de chargement dans le corps du tableau. */
export function LigneChargement({ colonnes, label }: { colonnes: number; label: string }) {
  return (
    <LigneMessage colonnes={colonnes}>
      <Loader2 aria-hidden className="mx-auto size-6 animate-spin text-baobab" />
      <span className="sr-only">{label}</span>
    </LigneMessage>
  );
}

/** Carte blanche de la page : chargement, état vide ou contenu hors tableau. */
export function CarteAdmin({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-card border border-filet bg-white", className)}>{children}</div>;
}

/** Chargement d'une page ou d'une carte entière. */
export function BlocChargement({ label }: { label: string }) {
  return (
    <CarteAdmin className="py-16 text-center">
      <Loader2 aria-hidden className="mx-auto size-6 animate-spin text-baobab" />
      <span className="sr-only">{label}</span>
    </CarteAdmin>
  );
}

/** Section titrée de la page (réglages, détail) : carte blanche, titre en Bricolage. */
export function SectionAdmin({ titre, description, actions, children, className }: { titre: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={titre} className={cn("rounded-card border border-filet bg-white p-5 sm:p-6", className)}>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <h2 className="font-display text-h3 font-bold text-encre">{titre}</h2>
          {description && <p className="mt-1 text-body-m text-texte2">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Initiales sur pastille Baobab clair (planche 25, colonne Propriétaire). */
export function Initiales({ prenom, nom }: { prenom?: string | null; nom?: string | null }) {
  const initiales = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-baobab-100 text-caption font-bold text-baobab">
      {initiales}
    </span>
  );
}
