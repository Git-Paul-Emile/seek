import { Armchair, CalendarDays, Eye, MapPin } from "lucide-react";
import type { Bien } from "@/api/bien";
import { formatDateLongue, formatIlYA } from "@/lib/dates";
import { formatFcfa, libelleFrequence } from "@/lib/fcfa";

// Haut de la fiche : badges, titre, quartier, prix et conditions, puis repères de fraîcheur.
// Charte « Le prix et le lieu d'abord ».

const conditions = (bien: Bien): string | null => {
  const parties: string[] = [];
  if (bien.chargesIncluses) parties.push("Charges incluses");
  if (bien.caution) {
    const mois = bien.prix && bien.caution % bien.prix === 0 ? bien.caution / bien.prix : null;
    parties.push(mois ? `Caution ${mois} mois (${formatFcfa(bien.caution)})` : `Caution ${formatFcfa(bien.caution)}`);
  }
  return parties.length ? parties.join(" · ") : null;
};

export function AnnonceResume({ bien }: { bien: Bien }) {
  const frequence = libelleFrequence(bien.frequencePaiement);
  const lieu = [bien.quartier, bien.ville].filter(Boolean).join(", ");
  const publication = bien.publishedAt ?? bien.createdAt;
  const texteConditions = conditions(bien);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {bien.typeTransaction && (
          <span className="rounded-full border border-bord-champ px-3 py-1 text-overline font-bold uppercase text-encre">
            {bien.typeTransaction.slug === "vente" ? "Vente" : "Location"}
          </span>
        )}
        {bien.meuble && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-baobab-100 px-3 py-1 text-body-m font-semibold text-baobab">
            <Armchair aria-hidden className="size-4" />
            Meublé
          </span>
        )}
      </div>

      <h1 className="mt-4 text-h2 font-bold text-encre lg:text-h1">{bien.titre ?? "Annonce"}</h1>

      {lieu && (
        <p className="mt-3 flex gap-2 text-body-l text-texte2">
          <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-encre" strokeWidth={1.75} />
          <span>
            <strong className="font-bold text-encre">{lieu}</strong>
            {bien.pointRepere && ` · Point de repère : ${bien.pointRepere}`}
          </span>
        </p>
      )}

      <div className="mt-5 border-y border-filet py-5">
        {bien.prix !== null ? (
          <p className="tabular flex flex-wrap items-baseline gap-x-2">
            <span className="text-price-l font-display font-bold text-encre lg:text-[40px] lg:leading-[44px]">
              {formatFcfa(bien.prix)}
            </span>
            {frequence && <span className="text-h3 text-texte2">/ {frequence}</span>}
          </p>
        ) : (
          <p className="text-h3 font-bold text-encre">Prix sur demande</p>
        )}
        {texteConditions && <p className="mt-2 text-body-l text-texte2">{texteConditions}</p>}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-body-l text-texte2">
        {(bien.nbVues ?? 0) > 0 && (
          <li className="inline-flex items-center gap-2">
            <Eye aria-hidden className="size-5" strokeWidth={1.75} />
            {bien.nbVues?.toLocaleString("fr-FR")} vue{(bien.nbVues ?? 0) > 1 ? "s" : ""}
          </li>
        )}
        {publication && <li>Publiée {formatIlYA(publication)}</li>}
      </ul>

      {bien.disponibleLe && (
        <div className="mt-6 flex gap-4 rounded-card bg-soleil-100 p-5">
          <CalendarDays aria-hidden className="size-6 shrink-0 text-encre" strokeWidth={1.75} />
          <div>
            <p className="text-body-l font-bold text-encre">Disponible le {formatDateLongue(bien.disponibleLe)}</p>
            <p className="text-body-m text-encre">Visites sur rendez-vous avec le propriétaire.</p>
          </div>
        </div>
      )}
    </div>
  );
}
