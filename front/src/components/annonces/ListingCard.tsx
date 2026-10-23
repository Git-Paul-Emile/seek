import { Link } from "react-router-dom";
import { Bath, BedDouble, Camera, Check, Heart, Maximize, Star } from "lucide-react";
import type { Bien } from "@/api/bien";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { useComparison } from "@/context/ComparisonContext";
import { useFavoriToggle } from "@/hooks/useFavoriToggle";
import { NO_BREAK_SPACE, formatFcfa, formatMontant, libelleFrequence } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Carte d'annonce de la charte (planche « Carte d'annonce ») :
// 1 photo 4:3, 2 prix en FCFA, 3 titre et quartier, 4 trois caractéristiques.
// Rectangulaire, jamais en arche, pour pouvoir comparer les résultats.

/** Champs lus par la carte : communs à `Bien` et aux annonces mises en avant. */
export interface AnnonceCarteData {
  id: string;
  titre: string | null;
  prix: number | null;
  prixAncien?: number | null;
  frequencePaiement?: string | null;
  photos: string[];
  ville: string | null;
  quartier: string | null;
  surface: number | null;
  nbChambres: number | null;
  nbSdb: number | null;
  estMisEnAvant?: boolean;
  typeLogement?: { nom: string; slug: string } | null;
  typeTransaction?: { nom: string; slug: string } | null;
}

interface ListingCardProps {
  annonce: AnnonceCarteData;
  /** Bien complet à passer au comparateur. Sans lui, la case « Comparer » est masquée. */
  comparable?: Bien;
  layout?: "vertical" | "horizontal";
  /** Mise en avant depuis la carte (survol d'un marqueur). */
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
  /** Image prioritaire : la première carte visible au chargement. */
  priority?: boolean;
  className?: string;
}

const lieu = (annonce: AnnonceCarteData) => [annonce.quartier, annonce.ville].filter(Boolean).join(", ");

const caracteristiques = (annonce: AnnonceCarteData) =>
  [
    annonce.nbChambres ? { icon: BedDouble, label: `${annonce.nbChambres}${NO_BREAK_SPACE}ch.` } : null,
    annonce.nbSdb ? { icon: Bath, label: `${annonce.nbSdb}${NO_BREAK_SPACE}sdb` } : null,
    annonce.surface ? { icon: Maximize, label: `${annonce.surface}${NO_BREAK_SPACE}m²` } : null,
  ].filter((item): item is { icon: typeof BedDouble; label: string } => item !== null);

function Prix({ annonce, size }: { annonce: AnnonceCarteData; size: "md" | "lg" }) {
  if (annonce.prix === null) {
    return <p className="text-price font-extrabold text-encre">Prix sur demande</p>;
  }
  const frequence = libelleFrequence(annonce.frequencePaiement);
  const baisse = annonce.prixAncien && annonce.prixAncien > annonce.prix ? annonce.prixAncien : null;
  return (
    <p className="tabular flex flex-wrap items-baseline gap-x-1">
      <span className={cn("font-extrabold text-encre", size === "lg" ? "text-h3" : "text-price")}>
        {formatFcfa(annonce.prix)}
      </span>
      {frequence && <span className="text-caption text-texte2">/ {frequence}</span>}
      {baisse && (
        <span className="text-caption text-texte2 line-through">
          <span className="sr-only">Ancien prix </span>
          {formatMontant(baisse)}
        </span>
      )}
    </p>
  );
}

function Vignette({ annonce, priority, compact }: { annonce: AnnonceCarteData; priority: boolean; compact: boolean }) {
  const photo = annonce.photos[0];
  const transaction = annonce.typeTransaction?.slug === "vente" ? "Vente" : annonce.typeTransaction ? "Location" : null;
  return (
    <div className="relative h-full w-full overflow-hidden bg-surface">
      {photo ? (
        <img
          src={photo}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <PropertyIllustration kind={illustrationForType(annonce.typeLogement?.slug ?? annonce.typeLogement?.nom)} />
      )}
      {annonce.estMisEnAvant && (
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-encre px-2.5 py-1 text-caption font-semibold text-soleil">
          <Star aria-hidden className="size-3.5 fill-soleil" />
          Premium
        </span>
      )}
      {!compact && transaction && (
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-overline font-bold uppercase text-encre">
          {transaction}
        </span>
      )}
      {!compact && annonce.photos.length > 1 && (
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-encre/70 px-2 py-1 text-caption font-semibold text-white">
          <Camera aria-hidden className="size-3.5" />
          1/{annonce.photos.length}
        </span>
      )}
    </div>
  );
}

function FavoriButton({ annonceId, titre, flottant }: { annonceId: string; titre: string; flottant: boolean }) {
  const { actif, toggle } = useFavoriToggle(annonceId);
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={actif}
      aria-label={actif ? `Retirer ${titre} de vos favoris` : `Ajouter ${titre} à vos favoris`}
      className={cn(
        "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-hover",
        flottant ? "bg-white shadow-card hover:bg-surface" : "hover:bg-surface",
      )}
    >
      <Heart aria-hidden className={cn("size-5", actif ? "fill-baobab text-baobab" : "text-encre")} strokeWidth={1.75} />
    </button>
  );
}

function CompareToggle({ bien }: { bien: Bien }) {
  const { isSelected, toggle, isFull, items } = useComparison();
  const selected = isSelected(bien.id);
  const disabled = !selected && isFull;
  return (
    <label
      className={cn(
        "relative z-10 mt-3 inline-flex cursor-pointer items-center gap-2 text-caption font-medium",
        disabled ? "cursor-not-allowed text-bord-champ" : "text-encre",
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={selected}
        disabled={disabled}
        onChange={() => toggle(bien)}
      />
      <span
        aria-hidden
        className={cn(
          "flex size-[18px] items-center justify-center rounded-[5px] border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
          selected ? "border-baobab bg-baobab text-white" : "border-bord-champ bg-white",
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {selected ? `Comparer (${items.length}/3)` : disabled ? "Comparaison pleine (3/3)" : "Comparer"}
    </label>
  );
}

export function ListingCard({
  annonce,
  comparable,
  layout = "vertical",
  highlighted = false,
  onHover,
  priority = false,
  className,
}: ListingCardProps) {
  const { isSelected } = useComparison();
  const titre = annonce.titre ?? "Annonce";
  const compared = comparable ? isSelected(comparable.id) : false;
  const traits = caracteristiques(annonce);
  const hoverProps = onHover
    ? { onMouseEnter: () => onHover(annonce.id), onMouseLeave: () => onHover(null) }
    : {};

  if (layout === "horizontal") {
    return (
      <article {...hoverProps} className={cn("relative flex gap-4 py-4", className)}>
        <div className="size-[120px] shrink-0 overflow-hidden rounded-card">
          <Vignette annonce={annonce} priority={priority} compact />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Prix annonce={annonce} size="md" />
            <div className="-my-2 -mr-2">
              <FavoriButton annonceId={annonce.id} titre={titre} flottant={false} />
            </div>
          </div>
          <h3 className="line-clamp-2 text-title font-medium text-encre">
            <Link
              to={`/annonce/${annonce.id}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-ring"
            >
              {titre}
            </Link>
          </h3>
          {lieu(annonce) && <p className="mt-1 truncate text-body-m text-texte2">{lieu(annonce)}</p>}
          {traits.length > 0 && (
            <p className="mt-2 text-body-m text-encre">{traits.map((t) => t.label).join(" · ")}</p>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      {...hoverProps}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-card border bg-white transition-shadow duration-hover hover:shadow-card",
        compared || highlighted ? "border-2 border-baobab" : "border-filet",
        className,
      )}
    >
      <div className="relative aspect-[4/3]">
        <Vignette annonce={annonce} priority={priority} compact={false} />
        <div className="absolute right-2.5 top-2.5">
          <FavoriButton annonceId={annonce.id} titre={titre} flottant />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Prix annonce={annonce} size="md" />
        <h3 className="mt-1 line-clamp-2 text-title font-medium text-encre">
          <Link
            to={`/annonce/${annonce.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {titre}
          </Link>
        </h3>
        {lieu(annonce) && <p className="mt-1 truncate text-caption text-texte2">{lieu(annonce)}</p>}
        <div className="min-h-3 flex-1" />
        {traits.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-filet pt-3 text-caption text-encre">
            {traits.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon aria-hidden className="size-4 text-texte2" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </ul>
        )}
        {comparable && <CompareToggle bien={comparable} />}
      </div>
    </article>
  );
}

/** Squelette de chargement : pulsation d'opacité, sans dégradé. */
export function ListingCardSkeleton({ layout = "vertical" }: { layout?: "vertical" | "horizontal" }) {
  if (layout === "horizontal") {
    return (
      <div className="flex animate-pulse gap-4 py-4" aria-hidden>
        <div className="size-[120px] shrink-0 rounded-card bg-surface" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-2/3 rounded bg-surface" />
          <div className="h-4 w-full rounded bg-surface" />
          <div className="h-4 w-1/2 rounded bg-surface" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-card border border-filet bg-white" aria-hidden>
      <div className="aspect-[4/3] bg-surface" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-1/2 rounded bg-surface" />
        <div className="h-4 w-5/6 rounded bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
        <div className="mt-3 h-4 w-2/3 rounded bg-surface" />
      </div>
    </div>
  );
}
