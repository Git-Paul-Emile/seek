import { Fragment, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { Check, Minus, Trophy } from "lucide-react";
import { fetchAnnoncePublique, type Bien } from "@/api/bien";
import { EmptyState } from "@/components/brand/EmptyState";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import {
  SECTIONS_COMPARAISON,
  ligneDifferente,
  meilleursIndex,
  type LigneComparaison,
  type Valeur,
} from "@/components/comparison/comparaisonLignes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/Switch";
import { formatDateLongue } from "@/lib/dates";
import { formatFcfa, formatMontant } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Comparateur (planche « Tableau de données ») : jusqu'à trois annonces côte à côte,
// la meilleure valeur signalée par une teinte Baobab et un mot, jamais par la couleur seule.

const MAX_BIENS = 3;
const MIN_BIENS = 2;
const DEUX_MINUTES_MS = 2 * 60 * 1000;

function Cellule({ ligne, valeur }: { ligne: LigneComparaison; valeur: Valeur }) {
  if (valeur === null || valeur === undefined) return <span className="text-texte2">Non précisé</span>;
  if (ligne.type === "oui-non") {
    return valeur ? (
      <span className="inline-flex items-center gap-1.5 text-baobab">
        <Check aria-hidden className="size-5" /> Oui
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-texte2">
        <Minus aria-hidden className="size-5" /> Non
      </span>
    );
  }
  if (ligne.type === "prix" && typeof valeur === "number") return <span className="tabular">{formatFcfa(valeur)}</span>;
  if (ligne.type === "nombre" && typeof valeur === "number") {
    return <span className="tabular">{formatMontant(valeur)}{ligne.unite ? ` ${ligne.unite}` : ""}</span>;
  }
  if (ligne.type === "date" && typeof valeur === "string") return <span>{formatDateLongue(valeur)}</span>;
  return <span>{String(valeur)}</span>;
}

function EnTeteBien({ bien }: { bien: Bien }) {
  return (
    <div className="w-[220px] text-left">
      <div className="aspect-[4/3] overflow-hidden rounded-control bg-surface">
        {bien.photos[0] ? (
          <img src={bien.photos[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <PropertyIllustration kind={illustrationForType(bien.typeLogement?.slug)} />
        )}
      </div>
      <p className="mt-3 text-price font-extrabold text-encre">{bien.prix !== null ? formatFcfa(bien.prix) : "Prix sur demande"}</p>
      <p className="line-clamp-2 text-body-m font-medium text-encre">{bien.titre ?? "Annonce"}</p>
      <p className="truncate text-caption text-texte2">{[bien.quartier, bien.ville].filter(Boolean).join(", ")}</p>
      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
        <Link to={`/annonce/${bien.id}`}>Voir l'annonce</Link>
      </Button>
    </div>
  );
}

export default function ComparaisonPage() {
  const [searchParams] = useSearchParams();
  const [differencesSeules, setDifferencesSeules] = useState(false);
  const ids = (searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_BIENS);

  const resultats = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["annonce-publie", id],
      queryFn: () => fetchAnnoncePublique(id),
      staleTime: DEUX_MINUTES_MS,
    })),
  });
  const chargement = resultats.some((r) => r.isPending);
  const echec = resultats.some((r) => r.isError);
  const biens = resultats.map((r) => r.data).filter((b): b is Bien => Boolean(b));

  if (ids.length < MIN_BIENS) {
    return (
      <div className="container">
        <EmptyState
          titreNiveau="h1"
          titre="Choisissez deux annonces à comparer"
          texte="Dans la recherche, cochez « Comparer » sur deux ou trois annonces, puis ouvrez la comparaison."
          action={
            <Button asChild>
              <Link to="/annonces">Voir les annonces</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-8 lg:py-12">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="text-h1 font-bold text-encre">Comparaison</h1>
          {!chargement && <p className="mt-1 text-body-l text-texte2">{biens.length} annonces côte à côte</p>}
        </div>
        <Switch label="Différences seulement" checked={differencesSeules} onChange={setDifferencesSeules} />
      </div>

      {echec && (
        <p className="mt-6 rounded-card border border-encre p-4 text-body-m text-encre">
          Une des annonces n'a pas pu être chargée : elle a peut-être été retirée. Les autres restent comparées ci-dessous.
        </p>
      )}

      {chargement ? (
        <div className="mt-8 h-96 animate-pulse rounded-card bg-surface" aria-label="Chargement de la comparaison" />
      ) : (
        <div className="mt-8 overflow-x-auto rounded-card border border-filet">
          <table className="w-full border-collapse text-left" style={{ minWidth: `${180 + biens.length * 252}px` }}>
            <caption className="sr-only">Comparaison des annonces sélectionnées</caption>
            <thead>
              <tr className="border-b border-filet">
                <td className="w-44 p-4 align-bottom text-caption text-texte2 sm:hidden">Faites glisser pour voir la suite</td>
                <td className="hidden w-44 sm:table-cell" />
                {biens.map((bien) => (
                  <th key={bien.id} scope="col" className="p-4 align-top font-normal">
                    <EnTeteBien bien={bien} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS_COMPARAISON.map((section) => {
                const lignes = section.lignes.filter((ligne) => !differencesSeules || ligneDifferente(biens.map(ligne.valeur)));
                if (lignes.length === 0) return null;
                return (
                  <Fragment key={section.titre}>
                    <tr className="bg-surface">
                      <th scope="colgroup" colSpan={biens.length + 1} className="px-4 py-2 text-overline font-bold uppercase text-texte2">
                        {section.titre}
                      </th>
                    </tr>
                    {lignes.map((ligne) => {
                      const valeurs = biens.map(ligne.valeur);
                      const meilleurs = meilleursIndex(ligne, valeurs);
                      return (
                        <tr key={ligne.libelle} className="h-14 border-t border-filet">
                          <th scope="row" className="px-4 text-body-m font-semibold text-encre">
                            {ligne.libelle}
                          </th>
                          {valeurs.map((valeur, index) => (
                            <td
                              key={biens[index].id}
                              className={cn("px-4 text-body-m text-encre", meilleurs.has(index) && "bg-baobab-100 font-semibold")}
                            >
                              <span className="inline-flex flex-wrap items-center gap-2">
                                <Cellule ligne={ligne} valeur={valeur} />
                                {meilleurs.has(index) && (
                                  <span className="inline-flex items-center gap-1 text-caption font-bold text-baobab">
                                    <Trophy aria-hidden className="size-4" />
                                    Meilleur
                                  </span>
                                )}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
