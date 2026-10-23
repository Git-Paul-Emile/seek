import type { BailHistorique } from "@/api/locataireAuth";
import { useLocataireHistorique } from "@/hooks/useLocataireEcheancier";
import { SkPropertyCards } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { formatFcfa, NO_BREAK_SPACE } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";

// Mes logements : le bail en cours et les baux passés, avec le suivi des loyers payés.

const STATUTS_BAIL: Record<string, { label: string; tone: StatusTone }> = {
  ACTIF: { label: "En cours", tone: "positif" },
  EN_PREAVIS: { label: "En préavis", tone: "attente" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  TERMINE: { label: "Terminé", tone: "neutre" },
  RESILIE: { label: "Résilié", tone: "arret" },
  ARCHIVE: { label: "Archivé", tone: "neutre" },
};

const STATUTS_EN_COURS = ["ACTIF", "EN_PREAVIS"];

function CarteBail({ bail }: { bail: BailHistorique }) {
  const statut = STATUTS_BAIL[bail.statut] ?? { label: bail.statut, tone: "neutre" as const };
  const photo = bail.bien.photos?.[0];
  const { payes, total } = bail.stats;
  const progression = total > 0 ? Math.round((payes / total) * 100) : 0;

  return (
    <article className="overflow-hidden rounded-card bg-white">
      <div className="aspect-[4/3] bg-surface">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <PropertyIllustration kind={illustrationForType(bail.bien.typeLogement?.nom ?? bail.bien.titre)} />
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-title font-semibold text-encre">{bail.bien.titre ?? "Logement"}</h3>
            <p className="mt-1 text-body-m text-texte2">{[bail.bien.ville, bail.bien.pays].filter(Boolean).join(", ")}</p>
          </div>
          <StatusBadge tone={statut.tone} size="sm">
            {statut.label}
          </StatusBadge>
        </div>
        <dl className="space-y-2 text-body-m">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <dt className="text-texte2">Période</dt>
            <dd className="text-right font-semibold text-encre">
              {formatDateLongue(bail.dateDebutBail)}
              {bail.dateFinBail ? ` au ${formatDateLongue(bail.dateFinBail)}` : ""}
            </dd>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <dt className="text-texte2">Loyer mensuel</dt>
            <dd className="text-right font-semibold tabular-nums text-encre">{formatFcfa(bail.montantLoyer)}</dd>
          </div>
        </dl>
        {total > 0 && (
          <div>
            <div className="mb-2 grid grid-cols-[1fr_auto] text-body-m">
              <span className="text-texte2">
                {payes} loyer{payes > 1 ? "s" : ""} payé{payes > 1 ? "s" : ""} sur {total}
              </span>
              <span className="font-semibold text-encre">{progression}{" "}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
              <div className="h-full rounded-full bg-baobab" style={{ width: `${progression}%` }} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Section({ titre, bails }: { titre: string; bails: BailHistorique[] }) {
  if (bails.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 font-display text-h3 font-bold text-encre">{titre}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {bails.map((bail) => (
          <CarteBail key={bail.id} bail={bail} />
        ))}
      </div>
    </section>
  );
}

export default function HistoriqueLogement() {
  const { data: bails = [], isLoading } = useLocataireHistorique();
  const enCours = bails.filter((bail) => STATUTS_EN_COURS.includes(bail.statut));
  const anciens = bails.filter((bail) => !STATUTS_EN_COURS.includes(bail.statut));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Mes logements</h1>
        <p className="mt-1 text-body-l text-texte2">Votre logement actuel et ceux que vous avez loués avec Seek.</p>
      </header>
      {isLoading ? (
        <SkPropertyCards count={3} />
      ) : bails.length === 0 ? (
        <EmptyState titre="Aucun logement pour l'instant" texte="Vos baux apparaîtront ici dès que votre propriétaire vous aura associé à un logement." />
      ) : (
        <>
          <Section titre="Logement actuel" bails={enCours} />
          <Section titre="Logements précédents" bails={anciens} />
        </>
      )}
    </div>
  );
}
