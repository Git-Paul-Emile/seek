import { FileText, LogOut, TriangleAlert } from "lucide-react";
import type { BailResume } from "@/api/locataire";
import type { ContratLocataireData } from "@/api/locataireAuth";
import { Button } from "@/components/ui/button";
import { formatFcfa, NO_BREAK_SPACE } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";
import { referenceBien } from "@/lib/referenceBien";
import { verifierFenetrePreavis } from "./preavis";

// « Mon bail » : les preuves du contrat en liste clé / valeur (charte, planche 34),
// puis les actions du locataire sur son bail.

function libelleCaution(contrat: ContratLocataireData | null | undefined, loyer: number) {
  const caution = contrat?.bail?.montantCaution;
  if (!caution) return null;
  const mois = caution / loyer;
  const enMois = Number.isInteger(mois) && mois > 0 ? ` · ${mois}${NO_BREAK_SPACE}mois` : "";
  return contrat.bail.cautionVersee ? `${formatFcfa(caution)}${enMois}` : `${formatFcfa(caution)} · non versée`;
}

interface MonBailProps {
  bail: BailResume;
  contrat: ContratLocataireData | null | undefined;
  onVoirContrat: () => void;
  onPreavis: () => void;
  onResilier: () => void;
}

export function MonBail({ bail, contrat, onVoirContrat, onPreavis, onResilier }: MonBailProps) {
  const caution = libelleCaution(contrat, bail.montantLoyer);
  const preavis = verifierFenetrePreavis(bail.dateFinBail);
  const lignes: { cle: string; valeur: string; mono?: boolean }[] = [
    { cle: "Début", valeur: formatDateLongue(bail.dateDebutBail) },
    ...(bail.dateFinBail ? [{ cle: "Fin", valeur: formatDateLongue(bail.dateFinBail) }] : []),
    { cle: "Loyer mensuel", valeur: formatFcfa(bail.montantLoyer) },
    ...(caution ? [{ cle: "Caution", valeur: caution }] : []),
    { cle: "Référence", valeur: referenceBien(bail.id), mono: true },
  ];

  return (
    <section aria-labelledby="titre-mon-bail">
      <h2 id="titre-mon-bail" className="mb-4 font-display text-h3 font-bold text-encre">
        Mon bail
      </h2>
      <div className="rounded-card bg-white px-4 lg:px-6">
        <dl className="divide-y divide-filet">
          {lignes.map(({ cle, valeur, mono }) => (
            <div key={cle} className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-4 py-3">
              <dt className="text-body-l text-texte2">{cle}</dt>
              <dd className={mono ? "text-right font-mono text-ref text-encre" : "text-right text-body-l font-semibold text-encre"}>
                {valeur}
              </dd>
            </div>
          ))}
        </dl>
        <div className="space-y-3 border-t border-filet py-4">
          <Button variant="outline" className="w-full" onClick={onVoirContrat}>
            <FileText aria-hidden />
            Voir le contrat
          </Button>
          {bail.statut === "ACTIF" && (
            <div>
              <Button variant="outline" className="w-full" onClick={onPreavis} disabled={!preavis.autorise}>
                <LogOut aria-hidden />
                Donner mon préavis
              </Button>
              {preavis.raison && <p className="mt-2 text-caption text-texte2">{preavis.raison}</p>}
            </div>
          )}
          {bail.dateFinBail && (
            <Button variant="ghost" className="w-full" onClick={onResilier}>
              <TriangleAlert aria-hidden />
              Résilier le bail
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
