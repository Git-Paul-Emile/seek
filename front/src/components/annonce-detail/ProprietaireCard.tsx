import { Flag } from "lucide-react";
import type { Bien } from "@/api/bien";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { referenceBien } from "@/lib/referenceBien";

// Carte du propriétaire (maquette « Fiche annonce ») : initiales, identité vérifiée,
// ancienneté et nombre d'annonces publiées. Puis le signalement et la référence.

const anneeInscription = (moisAnciennete: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - moisAnciennete);
  return date.getFullYear();
};

export function ProprietaireCard({ bien, onSignaler }: { bien: Bien; onSignaler: () => void }) {
  const proprietaire = bien.proprietaire;
  const score = bien.scoreProprietaire;
  const initiales = proprietaire
    ? `${proprietaire.prenom.charAt(0)}${proprietaire.nom.charAt(0)}`.toUpperCase()
    : "";
  const details = [
    score ? `Propriétaire depuis ${anneeInscription(score.moisAnciennete)}` : null,
    bien.nombreAnnoncesProprietaire
      ? `${bien.nombreAnnoncesProprietaire} annonce${bien.nombreAnnoncesProprietaire > 1 ? "s" : ""} sur Seek`
      : null,
  ].filter(Boolean);
  const reference = referenceBien(bien.id);

  return (
    <>
      {proprietaire && (
        <section aria-label="Propriétaire" className="flex gap-4 rounded-card border border-filet p-5">
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-baobab-100 text-h3 font-bold text-baobab">
            {initiales}
          </span>
          <div className="min-w-0">
            <p className="text-h3 font-semibold text-encre">
              {proprietaire.prenom} {proprietaire.nom}
            </p>
            {proprietaire.statutVerification === "VERIFIED" && (
              <StatusBadge tone="positif" className="mt-1">
                Identité vérifiée
              </StatusBadge>
            )}
            {details.length > 0 && <p className="mt-1 text-body-m text-texte2">{details.join(" · ")}</p>}
          </div>
        </section>
      )}
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onSignaler} className="inline-flex items-center gap-2 text-body-l font-medium text-encre underline underline-offset-4 hover:text-baobab">
          <Flag aria-hidden className="size-5" />
          Signaler l'annonce
        </button>
        <p className="font-mono text-ref text-texte2">Réf. {reference}</p>
      </div>
    </>
  );
}
