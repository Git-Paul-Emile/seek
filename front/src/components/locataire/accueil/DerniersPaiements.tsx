import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import type { Echeance } from "@/api/bail";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatFcfa } from "@/lib/fcfa";
import { libelleMois, STATUT_PAIEMENT } from "../paiementStatut";

// « Derniers paiements » : badge Payé et quittance à télécharger (charte, planche 34).

const NB_PAIEMENTS = 3;

interface DerniersPaiementsProps {
  echeancier: Echeance[];
  quittanceDisponible: (echeance: Echeance) => boolean;
  onTelecharger: (echeance: Echeance) => void;
}

export function DerniersPaiements({ echeancier, quittanceDisponible, onTelecharger }: DerniersPaiementsProps) {
  const derniers = echeancier
    .filter((echeance) => echeance.statut === "PAYE" || echeance.statut === "EN_ATTENTE_CONFIRMATION")
    .sort((a, b) => new Date(b.dateEcheance).getTime() - new Date(a.dateEcheance).getTime())
    .slice(0, NB_PAIEMENTS);

  return (
    <section aria-labelledby="titre-derniers-paiements">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-baseline gap-4">
        <h2 id="titre-derniers-paiements" className="font-display text-h3 font-bold text-encre">
          Derniers paiements
        </h2>
        <Link to="/locataire/paiements" className="text-body-m font-semibold text-baobab hover:underline">
          Tout voir
        </Link>
      </div>
      {derniers.length === 0 ? (
        <p className="rounded-card bg-white p-6 text-body-m text-texte2">
          Vos paiements apparaîtront ici, avec leur quittance, dès le premier loyer réglé.
        </p>
      ) : (
        <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:px-6">
          {derniers.map((echeance) => {
            const statut = STATUT_PAIEMENT[echeance.statut];
            const mois = libelleMois(echeance.dateEcheance);
            return (
              <li key={echeance.id} className="grid min-h-[72px] grid-cols-[1fr_auto_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-title font-semibold text-encre">{mois}</p>
                  <p className="text-body-m text-texte2">
                    {formatFcfa(echeance.montant)}
                    {echeance.modePaiement ? ` · ${echeance.modePaiement}` : ""}
                  </p>
                </div>
                <StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>
                {quittanceDisponible(echeance) ? (
                  <button
                    type="button"
                    onClick={() => onTelecharger(echeance)}
                    aria-label={`Télécharger la quittance de ${mois}`}
                    title="Télécharger la quittance"
                    className="flex size-11 items-center justify-center rounded-control bg-surface text-encre transition-colors duration-hover hover:bg-baobab-100"
                  >
                    <Download aria-hidden className="size-5" />
                  </button>
                ) : (
                  <span aria-hidden className="size-11" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
