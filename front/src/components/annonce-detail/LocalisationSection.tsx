import type { Bien } from "@/api/bien";
import { ETABLISSEMENT_LABELS } from "@/api/overpass";
import { CarteQuartier } from "@/components/carte/CarteQuartier";
import { useEtablissementsProches } from "@/hooks/useEtablissementsProches";
import { NO_BREAK_SPACE } from "@/lib/fcfa";

// Localisation : carte du quartier (zone de 500 m) et points d'intérêt avec leur distance.

const NOMBRE_POINTS = 5;
const METRES_PAR_KM = 1000;

const formatDistance = (metres: number) =>
  metres < METRES_PAR_KM
    ? `${metres}${NO_BREAK_SPACE}m`
    : `${(metres / METRES_PAR_KM).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}${NO_BREAK_SPACE}km`;

export function LocalisationSection({ bien }: { bien: Bien }) {
  const { etablissements, isLoading } = useEtablissementsProches(bien);
  if (bien.latitude === null || bien.longitude === null) return null;

  return (
    <section aria-labelledby="localisation-titre">
      <h2 id="localisation-titre" className="text-h2 font-bold text-encre">
        Localisation
      </h2>
      <CarteQuartier latitude={bien.latitude} longitude={bien.longitude} graine={bien.id} className="mt-4" />
      {isLoading && <p className="mt-4 text-body-m text-texte2">Recherche des lieux utiles autour du bien…</p>}
      {etablissements.length > 0 && (
        <ul className="mt-2 divide-y divide-filet">
          {etablissements.slice(0, NOMBRE_POINTS).map((etablissement) => (
            <li key={etablissement.id} className="flex items-baseline justify-between gap-4 py-4">
              <span className="text-body-l text-encre">
                {etablissement.nom || ETABLISSEMENT_LABELS[etablissement.type] || etablissement.type.replace(/_/g, " ")}
              </span>
              <span className="tabular shrink-0 text-body-l font-bold text-encre">
                {formatDistance(etablissement.distance ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
