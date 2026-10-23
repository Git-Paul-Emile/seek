import { Link } from "react-router-dom";
import { Bell, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Alerte } from "@/api/alerte";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { useActiverAlerte, useDesactiverAlerte, useMesAlertes, useSupprimerAlerte } from "@/hooks/useAlerte";
import { formatFcfa } from "@/lib/fcfa";

// Alertes SMS du compte : activer, mettre en pause, supprimer. Le quota est fixé par le backend.

const QUOTA_ALERTES = 2;

const resume = (alerte: Alerte) =>
  [alerte.typeLogement, alerte.quartier ?? alerte.ville, alerte.prixMax ? `jusqu'à ${formatFcfa(alerte.prixMax)}` : null]
    .filter(Boolean)
    .join(" · ") || "Toutes les nouvelles annonces";

export function MesAlertes() {
  const { data: alertes = [], isLoading, isError } = useMesAlertes();
  const activer = useActiverAlerte();
  const desactiver = useDesactiverAlerte();
  const supprimer = useSupprimerAlerte();
  const echec = () => toast("La modification n'a pas été enregistrée. Réessayez.");

  const basculer = (alerte: Alerte) => {
    const mutation = alerte.statut === "ACTIVE" ? desactiver : activer;
    mutation.mutate(alerte.id, {
      onSuccess: () => toast(alerte.statut === "ACTIVE" ? "Alerte mise en pause." : "Alerte réactivée."),
      onError: echec,
    });
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-4">
        <h2 className="text-h3 font-bold text-encre">Mes alertes SMS</h2>
        <p className="tabular text-body-m text-texte2">
          {alertes.length} sur {QUOTA_ALERTES}
        </p>
      </div>

      {isLoading && <div className="h-24 animate-pulse rounded-card bg-surface" aria-label="Chargement des alertes" />}
      {isError && <p className="text-body-l text-texte2">Vos alertes n'ont pas pu être chargées. Rechargez la page.</p>}

      {!isLoading && !isError && alertes.length === 0 && (
        <div className="rounded-card bg-surface p-6">
          <p className="text-body-l font-semibold text-encre">Aucune alerte pour l'instant.</p>
          <p className="mt-1 text-body-m text-texte2">Recevez un SMS dès qu'une annonce correspond à vos critères.</p>
          <Button asChild className="mt-4">
            <Link to="/alertes">Créer une alerte</Link>
          </Button>
        </div>
      )}

      <ul className="divide-y divide-filet rounded-card border border-filet">
        {alertes.map((alerte) => {
          const active = alerte.statut === "ACTIVE";
          const enCours = supprimer.isPending && supprimer.variables === alerte.id;
          return (
            <li key={alerte.id} className="flex flex-wrap items-center gap-4 p-4">
              <Bell aria-hidden className={active ? "size-6 shrink-0 text-baobab" : "size-6 shrink-0 text-texte2"} strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-body-l font-semibold text-encre">{resume(alerte)}</p>
                <StatusBadge tone={active ? "positif" : "neutre"} size="sm" className="mt-1">
                  {active ? "Active" : "En pause"}
                </StatusBadge>
              </div>
              <Switch label="Active" checked={active} onChange={() => basculer(alerte)} className="text-body-m" />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Supprimer l'alerte ${resume(alerte)}`}
                disabled={enCours}
                onClick={() => supprimer.mutate(alerte.id, { onSuccess: () => toast("Alerte supprimée."), onError: echec })}
              >
                {enCours ? <Loader2 aria-hidden className="animate-spin" /> : <Trash2 aria-hidden />}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
