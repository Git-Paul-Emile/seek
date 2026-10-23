import type { BailResume } from "@/api/locataire";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { StatusBadge } from "@/components/ui/StatusBadge";

// « Mon logement » : le logement dans l'arche, motif signature de la charte (planche 34).

export function CarteLogement({ bail }: { bail: BailResume }) {
  const { titre, quartier, ville } = bail.bien ?? {};
  const localisation = [quartier, ville].filter(Boolean).join(", ");
  return (
    <section aria-labelledby="titre-logement" className="flex items-center gap-5 rounded-sheet bg-white p-4 lg:p-6">
      <div className="aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-t-full rounded-b-card lg:w-32">
        <PropertyIllustration kind={illustrationForType(titre)} />
      </div>
      <div className="min-w-0">
        <p className="text-overline font-semibold uppercase text-texte2">Mon logement</p>
        <h2 id="titre-logement" className="mt-1 font-display text-h3 font-bold text-encre">
          {titre || localisation || "Logement"}
        </h2>
        {titre && localisation && <p className="mt-1 text-body-m text-texte2">{localisation}</p>}
        <StatusBadge tone={bail.statut === "EN_PREAVIS" ? "attente" : "positif"} className="mt-3">
          {bail.statut === "EN_PREAVIS" ? "En préavis" : "Bail actif"}
        </StatusBadge>
      </div>
    </section>
  );
}
