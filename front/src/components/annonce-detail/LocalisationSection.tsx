import type { Bien } from "@/api/bien";
import { CarteQuartier, type PointProche } from "@/components/carte/CarteQuartier";
import { useEtablissementsProches } from "@/hooks/useEtablissementsProches";
import { NO_BREAK_SPACE } from "@/lib/fcfa";
import { iconeEtablissement } from "@/lib/iconesEtablissements";
import { ETABLISSEMENT_LABELS } from "@/lib/libellesEtablissements";

// Localisation : carte du quartier (zone de 500 m) avec, pour chaque catégorie (pharmacie,
// hôpital, pompiers, police...), l'établissement le plus proche à son emplacement, puis la liste
// de ces établissements avec leur distance et l'icône de leur catégorie.

const METRES_PAR_KM = 1000;

const formatDistance = (metres: number) =>
  metres < METRES_PAR_KM
    ? `${metres}${NO_BREAK_SPACE}m`
    : `${(metres / METRES_PAR_KM).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}${NO_BREAK_SPACE}km`;

export function LocalisationSection({ bien }: { bien: Bien }) {
  const { etablissements, isLoading, isError } = useEtablissementsProches(bien);
  if (bien.latitude === null || bien.longitude === null) return null;

  const proches = etablissements.map((etablissement) => ({
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
      {isError && (
        <p className="mt-4 text-body-m text-texte2">Les lieux utiles autour du bien sont momentanément indisponibles. Revenez un peu plus tard.</p>
      )}
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
