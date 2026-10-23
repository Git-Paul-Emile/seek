import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Bien } from "@/api/bien";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { formatFcfa, formatFcfaCourt, libelleFrequence } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Marqueur de prix et aperçu d'annonce de la carte (planche « Recherche et carte »).

export type BienCarte = Bien & { latitude: number; longitude: number };

export function MarqueurPrix({ bien, actif, vu }: { bien: BienCarte; actif: boolean; vu: boolean }) {
  const premium = Boolean(bien.estMisEnAvant);
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1 whitespace-nowrap rounded-marker px-2.5 py-1.5 text-caption font-bold shadow-card transition-transform duration-hover",
        actif && "scale-110 bg-baobab text-white",
        !actif && premium && "bg-soleil text-encre",
        !actif && !premium && vu && "bg-surface text-texte2",
        !actif && !premium && !vu && "bg-white text-encre",
      )}
    >
      {premium && <Star aria-hidden className="size-3 fill-current" />}
      {bien.prix !== null ? formatFcfaCourt(bien.prix) : "Prix ?"}
    </span>
  );
}

export function ApercuBien({ bien }: { bien: BienCarte }) {
  const frequence = libelleFrequence(bien.frequencePaiement);
  const details = [bien.quartier ?? bien.ville, bien.nbChambres ? `${bien.nbChambres} ch.` : null, bien.surface ? `${bien.surface} m²` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      to={`/annonce/${bien.id}`}
      className="flex w-[280px] gap-3 rounded-card bg-white p-2 text-left shadow-float"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="size-20 shrink-0 overflow-hidden rounded-control bg-surface">
        {bien.photos[0] ? (
          <img src={bien.photos[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <PropertyIllustration kind={illustrationForType(bien.typeLogement?.slug)} />
        )}
      </span>
      <span className="min-w-0 py-1">
        {bien.prix !== null && (
          <span className="block text-body-m font-extrabold text-encre">
            {formatFcfa(bien.prix)}
            {frequence && <span className="font-normal text-texte2"> / {frequence}</span>}
          </span>
        )}
        <span className="block truncate text-body-m text-encre">{bien.titre ?? "Annonce"}</span>
        <span className="block truncate text-caption text-texte2">{details}</span>
      </span>
    </Link>
  );
}
