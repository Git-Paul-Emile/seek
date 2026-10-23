import { Link } from "react-router-dom";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import type { EtatDesLieux, StatutEtatDesLieux } from "@/api/etatDesLieux.api";
import { useEtatsDesLieuxLocataire } from "@/hooks/useEtatsDesLieuxLocataire";
import { SkListItems } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatDateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";

// États des lieux du locataire : ceux qui attendent sa réponse d'abord, puis l'historique.

const STATUTS: Record<StatutEtatDesLieux, { label: string; tone: StatusTone }> = {
  BROUILLON: { label: "Brouillon", tone: "neutre" },
  EN_ATTENTE_VALIDATION: { label: "À valider", tone: "attente" },
  VALIDE: { label: "Signé", tone: "positif" },
  CONTESTE: { label: "Contesté", tone: "attente" },
  EN_LITIGE: { label: "En litige", tone: "alerte" },
};

const STATUTS_A_TRAITER: StatutEtatDesLieux[] = ["EN_ATTENTE_VALIDATION", "CONTESTE"];

// La liste locataire renvoie le bien joint à chaque état des lieux.
type EtatDesLieuxAvecBien = EtatDesLieux & {
  bien?: { titre?: string | null; adresse?: string | null; ville?: string | { nom: string } | null };
};

function LigneEtatDesLieux({ edl }: { edl: EtatDesLieuxAvecBien }) {
  const statut = STATUTS[edl.statut] ?? { label: edl.statut, tone: "neutre" as const };
  const ville = typeof edl.bien?.ville === "object" ? edl.bien?.ville?.nom : edl.bien?.ville;
  const lieu = [edl.bien?.titre, ville].filter(Boolean).join(" · ");
  const aSigner = edl.statut === "EN_ATTENTE_VALIDATION";
  return (
    <li>
      <Link
        to={`/locataire/etats-des-lieux/${edl.id}`}
        className="grid min-h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4 py-4 transition-colors duration-hover hover:bg-surface/60"
      >
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-control",
            aSigner ? "bg-soleil text-encre" : "bg-baobab-100 text-baobab",
          )}
        >
          <ClipboardCheck aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-title font-semibold text-encre">
            État des lieux {edl.type === "ENTREE" ? "d'entrée" : "de sortie"}
          </p>
          <p className="text-body-m text-texte2">
            {lieu ? `${lieu} · ` : ""}
            {formatDateLongue(edl.dateRealisation)}
          </p>
          <StatusBadge tone={statut.tone} size="sm" className="mt-2 sm:hidden">
            {statut.label}
          </StatusBadge>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge tone={statut.tone} className="hidden sm:inline-flex">
            {statut.label}
          </StatusBadge>
          <ChevronRight aria-hidden className="size-5 text-texte2" />
        </div>
      </Link>
    </li>
  );
}

function Liste({ titre, edls }: { titre: string; edls: EtatDesLieuxAvecBien[] }) {
  if (edls.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-h3 font-bold text-encre">{titre}</h2>
      <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:px-6">
        {edls.map((edl) => (
          <LigneEtatDesLieux key={edl.id} edl={edl} />
        ))}
      </ul>
    </section>
  );
}

export default function EtatsDesLieuxList() {
  const { data = [], isLoading, isError } = useEtatsDesLieuxLocataire();
  const edls = data as EtatDesLieuxAvecBien[];
  const aTraiter = edls.filter((edl) => STATUTS_A_TRAITER.includes(edl.statut));
  const autres = edls.filter((edl) => !STATUTS_A_TRAITER.includes(edl.statut));

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">États des lieux</h1>
        <p className="mt-1 text-body-l text-texte2">Vos états des lieux d'entrée et de sortie, à vérifier puis signer.</p>
      </header>
      {isError ? (
        <p className="rounded-card bg-soleil-100 p-5 text-body-m font-semibold text-encre">
          Vos états des lieux n'ont pas pu être chargés. Réessayez dans un instant.
        </p>
      ) : isLoading ? (
        <SkListItems items={3} itemHeight="h-20" />
      ) : edls.length === 0 ? (
        <EmptyState
          titre="Aucun état des lieux pour l'instant"
          texte="Votre propriétaire vous préviendra dès qu'un état des lieux sera prêt à vérifier."
        />
      ) : (
        <>
          <Liste titre="À traiter" edls={aTraiter} />
          <Liste titre={aTraiter.length > 0 ? "Historique" : "Tous les états des lieux"} edls={autres} />
        </>
      )}
    </div>
  );
}
