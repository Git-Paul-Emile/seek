import { Check, Hourglass, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Echeance } from "@/api/bail";
import { Button } from "@/components/ui/button";
import { formatMontant, NO_BREAK_SPACE } from "@/lib/fcfa";
import { echeancesARegler, joursAvant, jourMois, nomMois } from "../paiementStatut";

// « Prochain loyer » en grand sur un bloc Baobab (charte, planche 34).

interface BlocProchainLoyerProps {
  echeancier: Echeance[];
  quittanceDisponible: (echeance: Echeance) => boolean;
  /** Le back n'accepte une déclaration que sur un bail ACTIF (pas pendant le préavis). */
  peutDeclarer: boolean;
  onPayer: () => void;
}

function IndicateurEcheance({ jours }: { jours: number }) {
  if (jours < 0) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-soleil px-3 text-body-m font-semibold text-encre">
        <TriangleAlert aria-hidden className="size-4" />
        En retard · {-jours}{NO_BREAK_SPACE}j
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full bg-baobab-900 px-3 text-body-m font-semibold text-white">
      {jours === 0 ? "Aujourd'hui" : `Dans ${jours}${NO_BREAK_SPACE}jour${jours > 1 ? "s" : ""}`}
    </span>
  );
}

export function BlocProchainLoyer({ echeancier, quittanceDisponible, peutDeclarer, onPayer }: BlocProchainLoyerProps) {
  const prochain = echeancesARegler(echeancier)[0];
  const enConfirmation = echeancier.filter((echeance) => echeance.statut === "EN_ATTENTE_CONFIRMATION").length;
  const dernierPaye = echeancier
    .filter((echeance) => echeance.statut === "PAYE" && echeance.datePaiement)
    .sort((a, b) => new Date(b.dateEcheance).getTime() - new Date(a.dateEcheance).getTime())[0];

  return (
    <section aria-labelledby="titre-prochain-loyer" className="rounded-sheet bg-baobab p-6 text-white lg:p-8">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 id="titre-prochain-loyer" className="text-overline font-semibold uppercase text-white/85">
          {prochain ? "Prochain loyer" : "Loyers"}
        </h2>
        {prochain && <IndicateurEcheance jours={joursAvant(prochain.dateEcheance)} />}
      </div>

      {prochain ? (
        <>
          <p className="mt-5 font-display font-bold">
            <span className="text-display-m xl:text-display">{formatMontant(prochain.montant)}</span>
            <span className="ml-2 text-h3">FCFA</span>
          </p>
          <p className="mt-2 text-body-l text-white/85">À régler avant le {jourMois(prochain.dateEcheance)}</p>
          {peutDeclarer && (
            <Button variant="inverse" size="lg" className="mt-6 w-full" onClick={onPayer}>
              <Check aria-hidden />
              J'ai payé ce loyer
            </Button>
          )}
        </>
      ) : (
        <p className="mt-4 font-display text-h3 font-bold">
          {echeancier.length === 0
            ? "Votre échéancier apparaîtra ici dès que votre propriétaire l'aura créé."
            : enConfirmation
              ? "Votre paiement attend la confirmation du propriétaire."
              : "Tous vos loyers sont réglés."}
        </p>
      )}

      {(dernierPaye || enConfirmation > 0) && (
        <ul className="mt-6 space-y-2 border-t border-white/20 pt-4 text-body-m text-white/85">
          {enConfirmation > 0 && prochain && (
            <li className="flex items-start gap-3">
              <Hourglass aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
              {enConfirmation} paiement{enConfirmation > 1 ? "s" : ""} en attente de confirmation
            </li>
          )}
          {dernierPaye?.datePaiement && (
            <li className="flex items-start gap-3">
              <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="capitalize">{nomMois(dernierPaye.dateEcheance)}</span> payé le{" "}
                {jourMois(dernierPaye.datePaiement)}
                {quittanceDisponible(dernierPaye) ? " · quittance disponible" : ""}
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
