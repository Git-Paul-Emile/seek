import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatFcfa } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Histogramme « Loyers encaissés, 12 derniers mois » (charte, planche 40) :
// barres Baobab clair, mois en cours en Baobab plein avec sa valeur en étiquette.

const MILLION = 1_000_000;
const MILLIER = 1_000;
const NB_GRADUATIONS = 3;

interface Echelle {
  diviseur: number;
  libelle: string;
}

const choisirEchelle = (max: number): Echelle =>
  max >= MILLION
    ? { diviseur: MILLION, libelle: "en millions de FCFA" }
    : { diviseur: MILLIER, libelle: "en milliers de FCFA" };

/** Pas « rond » (1, 2, 5 × 10ⁿ) pour que les graduations restent lisibles. */
const pasArrondi = (valeur: number): number => {
  const puissance = 10 ** Math.floor(Math.log10(valeur));
  const ratio = valeur / puissance;
  const multiple = ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10;
  return multiple * puissance;
};

const formatValeur = (valeur: number) =>
  valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const libelleMois = (cle: string) => format(new Date(`${cle}-01T00:00:00`), "MMM", { locale: fr });

const TITRE = "Loyers encaissés, 12 derniers mois";

export function EncaissementsChart({ data }: { data: { mois: string; montant: number }[] }) {
  const max = Math.max(...data.map((d) => d.montant), 0);
  const echelle = choisirEchelle(max);

  return (
    <section aria-label={TITRE} className="min-w-0 rounded-card border border-filet bg-white p-6">
      <div className="mb-5 grid grid-cols-1 items-baseline gap-1 sm:grid-cols-[1fr_auto] sm:gap-4">
        <h2 className="font-display text-h3 font-bold text-encre">{TITRE}</h2>
        {max > 0 && <p className="text-body-m text-texte2">{echelle.libelle}</p>}
      </div>
      {max > 0 ? (
        <Histogramme data={data} max={max} echelle={echelle} />
      ) : (
        <p className="flex h-[240px] items-center justify-center rounded-control bg-surface px-6 text-center text-body-m text-texte2">
          Aucun loyer encaissé sur les 12 derniers mois.
        </p>
      )}
    </section>
  );
}

interface HistogrammeProps {
  data: { mois: string; montant: number }[];
  max: number;
  echelle: Echelle;
}

function Histogramme({ data, max, echelle }: HistogrammeProps) {
  const pas = pasArrondi(max / echelle.diviseur / NB_GRADUATIONS);
  const plafond = Math.ceil(max / echelle.diviseur / pas) * pas;
  const graduations = Array.from({ length: Math.round(plafond / pas) + 1 }, (_, i) => i * pas);
  const dernier = data.length - 1;

  return (
    <figure>
      <figcaption className="sr-only">
        {data.map((d) => `${libelleMois(d.mois)} : ${formatFcfa(d.montant)}`).join(", ")}
      </figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-x-3" aria-hidden>
        <div className="relative h-[240px] w-6">
          {graduations.map((g) => (
            <span
              key={g}
              className="absolute right-0 translate-y-1/2 text-caption text-texte2"
              style={{ bottom: `${(g / plafond) * 100}%` }}
            >
              {formatValeur(g)}
            </span>
          ))}
        </div>
        <div className="relative h-[240px]">
          {graduations.map((g) => (
            <span
              key={g}
              className="absolute inset-x-0 border-t border-filet"
              style={{ bottom: `${(g / plafond) * 100}%` }}
            />
          ))}
          <div className="relative flex h-full items-end gap-1.5 sm:gap-2">
            {data.map((d, index) => (
              <div key={d.mois} className="relative flex h-full flex-1 items-end justify-center">
                {index === dernier && (
                  <span
                    className="absolute z-10 mb-1.5 whitespace-nowrap rounded-[6px] bg-encre px-1.5 py-0.5 text-caption font-bold text-white"
                    style={{ bottom: `${(d.montant / echelle.diviseur / plafond) * 100}%` }}
                  >
                    {formatValeur(d.montant / echelle.diviseur)}
                  </span>
                )}
                <span
                  className={cn("w-full rounded-t-[6px]", index === dernier ? "bg-baobab" : "bg-baobab-100")}
                  style={{ height: `${(d.montant / echelle.diviseur / plafond) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <span />
        <div className="mt-2 flex gap-1.5 sm:gap-2">
          {data.map((d, index) => (
            <span
              key={d.mois}
              className={cn(
                "flex-1 truncate text-center text-caption",
                index === dernier ? "font-bold text-encre" : "text-texte2",
              )}
            >
              {libelleMois(d.mois)}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
