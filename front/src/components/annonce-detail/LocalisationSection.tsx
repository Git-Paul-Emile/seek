import type { Bien } from "@/api/bien";
import { ETABLISSEMENT_LABELS } from "@/api/overpass";
import { CarteQuartier, type PointProche } from "@/components/carte/CarteQuartier";
import { useEtablissementsProches } from "@/hooks/useEtablissementsProches";
import { NO_BREAK_SPACE } from "@/lib/fcfa";
import { iconeEtablissement } from "@/lib/iconesEtablissements";

// Localisation : carte du quartier (zone de 500 m) avec les points d'intérêt à leur emplacement,
// puis la liste de ces points avec leur distance, chacun avec l'icône de sa catégorie.

const NOMBRE_POINTS = 5;
const METRES_PAR_KM = 1000;

const formatDistance = (metres: number) =>
  metres < METRES_PAR_KM
    ? `${metres}${NO_BREAK_SPACE}m`
    : `${(metres / METRES_PAR_KM).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}${NO_BREAK_SPACE}km`;

export function LocalisationSection({ bien }: { bien: Bien }) {
  const { etablissements, isLoading } = useEtablissementsProches(bien);
  if (bien.latitude === null || bien.longitude === null) return null;

  const proches = etablissements.slice(0, NOMBRE_POINTS).map((etablissement) => ({
    etablissement,
    categorie: ETABLISSEMENT_LABELS[etablissement.type] ?? etablissement.type.replace(/_/g, " "),
    distance: formatDistance(etablissement.distance ?? 0),
  }));
  const points: PointProche[] = proches.map(({ etablissement, categorie, distance }) => ({
    id: etablissement.id,
    type: etablissement.type,
    categorie,
    nom: etablissement.nom && etablissement.nom !== categorie ? etablissement.nom : null,
    distance,
    latitude: etablissement.latitude,
    longitude: etablissement.longitude,
  }));

  return (
    <section aria-labelledby="localisation-titre">
      <h2 id="localisation-titre" className="text-h2 font-bold text-encre">
        Localisation
      </h2>
      <CarteQuartier latitude={bien.latitude} longitude={bien.longitude} graine={bien.id} points={points} infoBien={bien.titre ?? undefined} className="mt-4" />
      {isLoading && <p className="mt-4 text-body-m text-texte2">Recherche des lieux utiles autour du bien…</p>}
      {proches.length > 0 && (
        <ul className="mt-2 divide-y divide-filet">
          {proches.map(({ etablissement, categorie, distance }) => {
            const Icon = iconeEtablissement(etablissement.type);
            return (
              <li key={etablissement.id} className="flex items-center justify-between gap-4 py-4">
                <span className="flex items-center gap-3 text-body-l text-encre">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-encre text-white">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  {etablissement.nom || categorie}
                </span>
                <span className="tabular shrink-0 text-body-l font-bold text-encre">{distance}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
