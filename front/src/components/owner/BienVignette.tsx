import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { cn } from "@/lib/utils";

// Vignette d'un bien dans les tableaux (charte, planches 25 et 40) : la première photo,
// sinon l'illustration du type de logement.

interface BienVignetteProps {
  photo?: string | null;
  typeLogement?: string | null;
  titre: string;
  className?: string;
}

export function BienVignette({ photo, typeLogement, titre, className }: BienVignetteProps) {
  return (
    <span className={cn("block h-14 w-[76px] shrink-0 overflow-hidden rounded-control bg-surface", className)}>
      {photo ? (
        <img src={photo} alt={titre} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <PropertyIllustration kind={illustrationForType(typeLogement)} />
      )}
    </span>
  );
}
