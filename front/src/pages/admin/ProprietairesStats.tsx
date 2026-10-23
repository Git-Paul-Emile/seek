import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Hourglass, UserCheck, Users, UserX } from "lucide-react";
import { useProprietairesStats } from "@/hooks/useStats";
import type { ProprietaireStats } from "@/api/stats";
import { buttonVariants } from "@/components/ui/button";
import { SkKpiCards } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/owner/dashboard/KpiCard";
import { EmptyState } from "@/components/brand/EmptyState";
import { BlocChargement, CarteAdmin, EnTeteAdmin, Initiales, SectionAdmin } from "@/components/admin/table/Tableau";

// Vue d'ensemble des propriétaires : chiffres clés (planche 24), répartitions en barres
// horizontales comme le tableau de bord, puis les classements.

const VERIFICATION: Record<string, { label: string; tone: StatusTone }> = {
  NOT_VERIFIED: { label: "Non vérifié", tone: "neutre" },
  PENDING: { label: "À vérifier", tone: "attente" },
  VERIFIED: { label: "Vérifié", tone: "positif" },
  REJECTED: { label: "Refusé", tone: "arret" },
};

const verificationDe = (statut: string) => VERIFICATION[statut] ?? { label: statut, tone: "neutre" as const };

function Barres({ barres, vide }: { barres: { libelle: string; valeur: number }[]; vide: string }) {
  const max = Math.max(...barres.map(({ valeur }) => valeur), 0);
  if (max === 0) return <p className="rounded-control bg-surface p-6 text-center text-body-m text-texte2">{vide}</p>;
  return (
    <ul className="space-y-3">
      {barres.map(({ libelle, valeur }) => (
        <li key={libelle} className="grid grid-cols-[minmax(96px,30%)_1fr_auto] items-center gap-3 text-body-m">
          <span className="truncate text-encre">{libelle}</span>
          <span aria-hidden className="h-3 overflow-hidden rounded-full bg-surface">
            <span className="block h-full rounded-full bg-baobab" style={{ width: `${(valeur / max) * 100}%` }} />
          </span>
          <span className="w-10 text-right font-semibold tabular-nums text-encre">{valeur}</span>
        </li>
      ))}
    </ul>
  );
}

function Classement({ proprietaires }: { proprietaires: ProprietaireStats["topProprietaires"] }) {
  if (proprietaires.length === 0) return <p className="rounded-control bg-surface p-6 text-center text-body-m text-texte2">Aucun propriétaire avec des biens pour l'instant.</p>;
  return (
    <ol className="divide-y divide-filet">
      {proprietaires.map((proprietaire, index) => (
        <li key={proprietaire.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-baobab-100 text-caption font-bold text-baobab">{index + 1}</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-encre">
              {proprietaire.prenom} {proprietaire.nom}
            </span>
            <span className="block tabular-nums text-body-m text-texte2">{proprietaire.telephone}</span>
          </span>
          <span className="text-right text-body-m text-texte2">
            <span className="block font-semibold tabular-nums text-encre">
              {proprietaire.totalBiens} bien{proprietaire.totalBiens > 1 ? "s" : ""}
            </span>
            {proprietaire.biensActifs} actif{proprietaire.biensActifs > 1 ? "s" : ""} · {proprietaire.totalLocataires} locataire{proprietaire.totalLocataires > 1 ? "s" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Inscriptions({ proprietaires }: { proprietaires: ProprietaireStats["recentProprietaires"] }) {
  if (proprietaires.length === 0) return <p className="rounded-control bg-surface p-6 text-center text-body-m text-texte2">Aucune inscription récente.</p>;
  return (
    <ul className="divide-y divide-filet">
      {proprietaires.map((proprietaire) => {
        const verification = verificationDe(proprietaire.statutVerification);
        return (
          <li key={proprietaire.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
            <Initiales prenom={proprietaire.prenom} nom={proprietaire.nom} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-encre">
                {proprietaire.prenom} {proprietaire.nom}
              </span>
              <span className="block text-body-m text-texte2">Inscrit le {format(new Date(proprietaire.createdAt), "dd/MM/yyyy")}</span>
            </span>
            <StatusBadge tone={verification.tone} size="sm">
              {verification.label}
            </StatusBadge>
          </li>
        );
      })}
    </ul>
  );
}

export default function ProprietairesStats() {
  const { data: stats, isLoading, error } = useProprietairesStats();

  const compte = (statut: string) => stats?.byStatutVerification.find((s) => s.statut === statut)?.count ?? 0;
  const enAttente = compte("PENDING");

  const entete = (
    <EnTeteAdmin
      titre="Propriétaires"
      description="Inscriptions, vérifications d'identité et propriétaires les plus actifs."
      actions={
        <Link to="/admin/verifications" className={buttonVariants()}>
          {enAttente > 0 ? `Vérifications · ${enAttente}` : "Vérifications"}
        </Link>
      }
    />
  );

  if (error) {
    return (
      <div>
        {entete}
        <CarteAdmin>
          <EmptyState titre="Statistiques indisponibles" texte="Le chargement a échoué. Rechargez la page dans quelques instants." />
        </CarteAdmin>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entete}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {isLoading || !stats ? (
          <SkKpiCards />
        ) : (
          <>
            <KpiCard icon={Users} label="Propriétaires" value={stats.total} />
            <KpiCard icon={UserCheck} label="Vérifiés" value={compte("VERIFIED")} />
            <KpiCard
              icon={Hourglass}
              label="À vérifier"
              value={enAttente}
              tone={enAttente > 0 ? "alerte" : "neutre"}
              footer={
                enAttente > 0 ? (
                  <Link to="/admin/verifications" className="font-semibold text-encre underline-offset-4 hover:underline">
                    Ouvrir la file
                  </Link>
                ) : undefined
              }
            />
            <KpiCard icon={UserX} label="Non vérifiés" value={compte("NOT_VERIFIED")} />
          </>
        )}
      </div>

      {isLoading || !stats ? (
        <BlocChargement label="Chargement des statistiques" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionAdmin titre="Vérification d'identité">
            <Barres
              barres={stats.byStatutVerification.map(({ statut, count }) => ({ libelle: verificationDe(statut).label, valeur: count }))}
              vide="Aucun propriétaire pour l'instant."
            />
          </SectionAdmin>
          <SectionAdmin titre="Villes les plus représentées">
            <Barres barres={stats.byVille.map(({ ville, count }) => ({ libelle: ville, valeur: count }))} vide="Aucune ville renseignée." />
          </SectionAdmin>
          <SectionAdmin titre="Les plus actifs">
            <Classement proprietaires={stats.topProprietaires} />
          </SectionAdmin>
          <SectionAdmin titre="Inscriptions récentes">
            <Inscriptions proprietaires={stats.recentProprietaires} />
          </SectionAdmin>
        </div>
      )}
    </div>
  );
}
