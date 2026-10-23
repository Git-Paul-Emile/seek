import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { Initiales } from "@/components/owner/dashboard/SuiviLoyers";
import { useBiensEnRetard } from "@/hooks/useBail";
import { useEnvoyerRappel } from "@/hooks/useQuittance";
import type { BienEnRetard } from "@/api/bail";
import { formatFcfa } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";

// Suivi des loyers en retard : un bloc par bail, échéances dues et relance du locataire.

const MS_PAR_JOUR = 86_400_000;
const joursDepuis = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / MS_PAR_JOUR));

function CarteRetard({ retard }: { retard: BienEnRetard }) {
  const relance = useEnvoyerRappel();
  const nom = `${retard.locataire.prenom} ${retard.locataire.nom}`;
  const premiere = retard.echeancesEnRetard[0];
  const localisation = [retard.bien.adresse, retard.bien.ville].filter(Boolean).join(", ");

  const relancer = () => {
    if (!premiere) return;
    relance.mutate(
      { bienId: retard.bien.id, bailId: retard.bailId, echeanceId: premiere.id },
      {
        onSuccess: () => toast.success(`Relance envoyée à ${nom} par SMS et e-mail`),
        onError: () => toast.error("La relance n'est pas partie. Réessayez dans un instant."),
      },
    );
  };

  return (
    <article className="rounded-card border border-filet bg-white p-5 lg:p-6">
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
        <Initiales nom={nom} />
        <div className="min-w-0">
          <h2 className="text-title font-semibold text-encre">{nom}</h2>
          <p className="truncate text-body-m text-texte2">
            {retard.bien.titre || "Bien loué"}
            {localisation && ` · ${localisation}`}
          </p>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
          <StatusBadge tone="alerte">En retard · {retard.joursRetardMax} j</StatusBadge>
          <Button size="sm" variant="outline" onClick={relancer} disabled={relance.isPending || !premiere}>
            {relance.isPending ? "Envoi…" : "Relancer"}
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/owner/biens/${retard.bien.id}/paiements`}>Paiements</Link>
          </Button>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-control bg-surface p-4 text-center sm:grid-cols-3">
        <div>
          <dt className="text-caption text-texte2">Échéances</dt>
          <dd className="text-title font-bold text-encre">{retard.nbEcheancesEnRetard}</dd>
        </div>
        <div>
          <dt className="text-caption text-texte2">Montant dû</dt>
          <dd className="text-title font-bold text-encre">{formatFcfa(retard.totalRetard)}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-caption text-texte2">Téléphone</dt>
          <dd className="text-body-m font-semibold text-encre">
            <a href={`tel:${retard.locataire.telephone}`} className="underline underline-offset-4">
              {retard.locataire.telephone}
            </a>
          </dd>
        </div>
      </dl>

      <ul className="mt-4 divide-y divide-filet">
        {retard.echeancesEnRetard.map((echeance) => (
          <li key={echeance.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
            <span className="text-body-l text-encre">
              Échéance du {formatDateLongue(echeance.dateEcheance)}
              <span className="block text-body-m text-texte2">{joursDepuis(echeance.dateEcheance)} jours de retard</span>
            </span>
            <span className="text-body-l font-bold text-encre">{formatFcfa(echeance.montant)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function LoyersEnRetardPage() {
  const { data: retards = [], isLoading } = useBiensEnRetard();
  const total = retards.reduce((somme, r) => somme + r.totalRetard, 0);

  return (
    <div className="space-y-6">
      <header>
        <Link to="/owner/paiements" className="text-body-m font-semibold text-baobab hover:underline">
          Paiements
        </Link>
        <h1 className="mt-1 font-display text-h2 font-bold text-encre lg:text-h1">Loyers en retard</h1>
        {!isLoading && retards.length > 0 && (
          <p className="mt-1 text-body-l text-texte2">
            {retards.length} locataire{retards.length > 1 ? "s" : ""} · {formatFcfa(total)} à relancer
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des retards">
          {[1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-card bg-white" />)}
        </div>
      ) : retards.length === 0 ? (
        <EmptyState
          titre="Aucun loyer en retard"
          texte="Tous vos locataires sont à jour. Les retards apparaîtront ici dès le lendemain d'une échéance."
          illustration="villa"
        />
      ) : (
        <div className="space-y-4">
          {retards.map((retard) => <CarteRetard key={retard.bailId} retard={retard} />)}
        </div>
      )}
    </div>
  );
}
