import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEnvoyerRappel } from "@/hooks/useQuittance";
import { useConfirmerReception } from "@/hooks/useBail";
import { cn } from "@/lib/utils";

// Liste « Loyers en retard » du tableau de bord (charte, planches 33 et 40) : retards
// à relancer, puis paiements déclarés par un locataire à confirmer.

export interface LigneSuivi {
  cle: string;
  nom: string;
  detail: string;
  bienId: string;
  bailId: string;
  echeanceId: string;
  /** Jours de retard, absent pour une confirmation demandée. */
  joursRetard?: number;
}

const initialesDe = (nom: string) =>
  nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();

export function Initiales({ nom, className }: { nom: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full bg-baobab-100 text-body-l font-bold text-baobab",
        className,
      )}
    >
      {initialesDe(nom)}
    </span>
  );
}

function ActionLigne({ ligne }: { ligne: LigneSuivi }) {
  const relance = useEnvoyerRappel();
  const confirmation = useConfirmerReception();
  const variables = { bienId: ligne.bienId, bailId: ligne.bailId, echeanceId: ligne.echeanceId };

  if (ligne.joursRetard === undefined) {
    return (
      <Button
        size="sm"
        disabled={confirmation.isPending}
        onClick={() =>
          confirmation.mutate(variables, {
            onSuccess: () => toast.success(`Paiement de ${ligne.nom} confirmé`),
            onError: () => toast.error("La confirmation n'a pas abouti. Réessayez dans un instant."),
          })
        }
      >
        {confirmation.isPending ? "Confirmation…" : "Confirmer"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={relance.isPending}
      onClick={() =>
        relance.mutate(variables, {
          onSuccess: () => toast.success(`Relance envoyée à ${ligne.nom}`),
          onError: () => toast.error("La relance n'est pas partie. Réessayez dans un instant."),
        })
      }
    >
      {relance.isPending ? "Envoi…" : "Relancer"}
    </Button>
  );
}

function BadgeLigne({ ligne, compact }: { ligne: LigneSuivi; compact: boolean }) {
  if (ligne.joursRetard === undefined) {
    return <StatusBadge tone="attente">{compact ? "À confirmer" : "Confirmation demandée"}</StatusBadge>;
  }
  const jours = `${ligne.joursRetard} j`;
  return <StatusBadge tone="alerte">{compact ? jours : `En retard · ${jours}`}</StatusBadge>;
}

interface SuiviLoyersProps {
  lignes: LigneSuivi[];
  /** Mobile : badge court et ligne cliquable, sans bouton d'action. */
  compact?: boolean;
}

export function SuiviLoyers({ lignes, compact = false }: SuiviLoyersProps) {
  if (lignes.length === 0) {
    return (
      <p className="rounded-control bg-surface px-4 py-6 text-center text-body-m text-texte2">
        Aucun loyer en retard. Tout est à jour.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-filet">
      {lignes.map((ligne) => {
        const contenu = (
          <>
            <Initiales nom={ligne.nom} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-title font-semibold text-encre">{ligne.nom}</p>
              <p className={cn("text-body-m text-texte2", compact ? "truncate" : "line-clamp-2")}>{ligne.detail}</p>
            </div>
            <BadgeLigne ligne={ligne} compact={compact} />
          </>
        );
        return (
          <li key={ligne.cle}>
            {compact ? (
              <Link to={`/owner/biens/${ligne.bienId}/paiements`} className="flex items-center gap-3 py-4">
                {contenu}
              </Link>
            ) : (
              <div className="flex items-center gap-4 py-4">
                {contenu}
                <ActionLigne ligne={ligne} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
