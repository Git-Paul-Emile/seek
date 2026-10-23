import { Link } from "react-router-dom";
import { ChevronRight, ClipboardCheck, IdCard } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BienVignette } from "@/components/owner/BienVignette";
import { formatMontant } from "@/lib/fcfa";
import type { LigneBienApercu, TacheAFaire } from "./useTableauDeBordProprietaire";

// Blocs « Mes biens » et « À faire » du tableau de bord (charte, planches 33 et 40).

const COULEURS_REPARTITION = {
  occupes: "#0A5C43",
  libres: "#FFC233",
  travaux: "#7F908A",
} as const;

const RAYON = 52;
const EPAISSEUR = 16;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

interface Repartition {
  total: number;
  occupes: number;
  libres: number;
  travaux: number;
}

/** Anneau de répartition des biens, version mobile. */
export function RepartitionBiens({ repartition }: { repartition: Repartition }) {
  const segments = [
    { cle: "occupes", label: "Occupés", valeur: repartition.occupes },
    { cle: "libres", label: "Libres", valeur: repartition.libres },
    { cle: "travaux", label: "En travaux", valeur: repartition.travaux },
  ] as const;
  let decalage = 0;

  return (
    <div className="flex items-center gap-6 rounded-card bg-white p-5">
      <div className="relative size-[132px] shrink-0">
        <svg viewBox="0 0 132 132" className="size-full -rotate-90" aria-hidden>
          <circle cx="66" cy="66" r={RAYON} fill="none" stroke="#F3F7F5" strokeWidth={EPAISSEUR} />
          {repartition.total > 0 &&
            segments.map(({ cle, valeur }) => {
              const longueur = (valeur / repartition.total) * CIRCONFERENCE;
              const cercle = (
                <circle
                  key={cle}
                  cx="66"
                  cy="66"
                  r={RAYON}
                  fill="none"
                  stroke={COULEURS_REPARTITION[cle]}
                  strokeWidth={EPAISSEUR}
                  strokeDasharray={`${longueur} ${CIRCONFERENCE - longueur}`}
                  strokeDashoffset={-decalage}
                />
              );
              decalage += longueur;
              return cercle;
            })}
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-h2 font-bold text-encre">{repartition.total}</span>
          <span className="text-body-m text-texte2">bien{repartition.total > 1 ? "s" : ""}</span>
        </p>
      </div>
      <ul className="min-w-0 flex-1 space-y-3">
        {segments.map(({ cle, label, valeur }) => (
          <li key={cle} className="flex items-center gap-3 text-body-l text-encre">
            <span aria-hidden className="size-3.5 shrink-0 rounded-full" style={{ background: COULEURS_REPARTITION[cle] }} />
            <span className="flex-1">{label}</span>
            <span className="font-bold">{valeur}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tableau « Mes biens », version desktop. */
export function ApercuBiensTable({ lignes, moisCourant }: { lignes: LigneBienApercu[]; moisCourant: string }) {
  const entete = "pb-3 text-left text-overline font-semibold uppercase text-texte2";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-filet">
            <th scope="col" className={entete}>Bien</th>
            <th scope="col" className={entete}>Locataire</th>
            <th scope="col" className={`${entete} pr-8 text-right`}>Loyer</th>
            <th scope="col" className={entete}>{moisCourant}</th>
            <th scope="col" className={entete}>Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-filet">
          {lignes.map((ligne) => (
            <tr key={ligne.id}>
              <td className="py-4 pr-4">
                <Link to={`/owner/biens/${ligne.id}`} className="flex items-center gap-4 rounded-control">
                  <BienVignette photo={ligne.photo} typeLogement={ligne.typeLogement} titre={ligne.titre} />
                  <span className="min-w-0">
                    <span className="block truncate text-title font-semibold text-encre">{ligne.titre}</span>
                    <span className="block font-mono text-ref text-texte2">Réf. {ligne.reference}</span>
                  </span>
                </Link>
              </td>
              <td className="py-4 pr-4 text-body-l text-encre">
                {ligne.locataire ?? <span className="text-texte2">Aucun locataire</span>}
              </td>
              <td className="py-4 pr-8 text-right text-body-l font-bold text-encre">
                {ligne.loyer ? formatMontant(ligne.loyer) : ""}
              </td>
              <td className="py-4 pr-4">
                <StatusBadge tone={ligne.badge.tone}>{ligne.badge.label}</StatusBadge>
              </td>
              <td className="py-4 text-body-l text-encre">{ligne.occupation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ICONES_TACHE = { "etat-des-lieux": ClipboardCheck, identite: IdCard } as const;

export function ListeAFaire({ taches }: { taches: TacheAFaire[] }) {
  return (
    <ul className="divide-y divide-filet rounded-card bg-white px-5 lg:border lg:border-filet">
      {taches.map((tache) => {
        const Icone = ICONES_TACHE[tache.type];
        return (
          <li key={tache.cle}>
            <Link to={tache.to} className="flex items-center gap-4 py-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-soleil-100 text-encre">
                <Icone aria-hidden className="size-6" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-title font-semibold text-encre">{tache.titre}</span>
                <span className="block truncate text-body-m text-texte2">{tache.detail}</span>
              </span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-texte2" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
