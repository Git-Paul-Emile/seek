import { Link } from "react-router-dom";
import { Building2, CircleCheck, Hourglass, Users } from "lucide-react";
import { SkChartBlock, SkKpiCards } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/owner/dashboard/KpiCard";
import { EnTeteAdmin } from "@/components/admin/table/Tableau";
import { STATUT_ANNONCE } from "@/components/admin/annonces/useModerationAnnonces";
import { useAdminStats } from "@/hooks/useStats";
import { formatIlYA } from "@/lib/dates";
import type { StatutAnnonce } from "@/api/bien";

// Tableau de bord de l'administration : la file de modération d'abord, puis la
// répartition des annonces. Barres horizontales en Baobab, valeurs écrites en clair.

interface Barre {
  libelle: string;
  valeur: number;
}

function BarresHorizontales({ titre, barres, vide }: { titre: string; barres: Barre[]; vide: string }) {
  const max = Math.max(...barres.map(({ valeur }) => valeur), 0);
  return (
    <section aria-label={titre} className="rounded-card border border-filet bg-white p-6">
      <h2 className="mb-5 font-display text-h3 font-bold text-encre">{titre}</h2>
      {max === 0 ? (
        <p className="rounded-control bg-surface p-6 text-center text-body-m text-texte2">{vide}</p>
      ) : (
        <ul className="space-y-3">
          {barres.map(({ libelle, valeur }) => (
            <li key={libelle} className="grid grid-cols-[minmax(96px,30%)_1fr_auto] items-center gap-3 text-body-m">
              <span className="truncate text-encre">{libelle}</span>
              <span className="h-3 overflow-hidden rounded-full bg-surface" aria-hidden>
                <span className="block h-full rounded-full bg-baobab" style={{ width: `${(valeur / max) * 100}%` }} />
              </span>
              <span className="w-10 text-right font-semibold tabular-nums text-encre">{valeur}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <EnTeteAdmin titre="Tableau de bord" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <SkKpiCards />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkChartBlock />
          <SkChartBlock />
        </div>
      </div>
    );
  }

  const compte = (statut: StatutAnnonce) => stats.annoncesByStatut.find((s) => s.statut === statut)?.count ?? 0;
  const enAttente = compte("EN_ATTENTE");
  const parStatut = stats.annoncesByStatut.map(({ statut, count }) => ({
    libelle: STATUT_ANNONCE[statut as StatutAnnonce]?.label ?? statut,
    valeur: count,
  }));

  return (
    <div className="space-y-6 lg:space-y-8">
      <EnTeteAdmin titre="Tableau de bord" description="Modération et activité de la plateforme." />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          icon={Hourglass}
          label="Annonces à modérer"
          value={enAttente}
          tone={enAttente > 0 ? "alerte" : "neutre"}
          footer={
            <Link to="/admin/annonces" className="font-semibold text-encre underline-offset-4 hover:underline">
              Ouvrir la file
            </Link>
          }
        />
        <KpiCard icon={CircleCheck} label="Annonces publiées" value={compte("PUBLIE")} />
        <KpiCard icon={Building2} label="Biens enregistrés" value={stats.totalBiens} />
        <KpiCard icon={Users} label="Propriétaires" value={stats.totalProprietaires} />
      </div>

      <section aria-labelledby="titre-file" className="rounded-card border border-filet bg-white p-6">
        <div className="mb-4 grid grid-cols-[1fr_auto] items-baseline gap-4">
          <h2 id="titre-file" className="font-display text-h3 font-bold text-encre">
            Dernières annonces en attente
          </h2>
          <Link to="/admin/annonces" className="text-body-m font-semibold text-baobab hover:underline">
            Tout voir
          </Link>
        </div>
        {stats.recentEnAttente.length === 0 ? (
          <p className="rounded-control bg-surface p-6 text-center text-body-m text-texte2">Aucune annonce en attente. La file est à jour.</p>
        ) : (
          <ul className="divide-y divide-filet">
            {stats.recentEnAttente.map((annonce) => (
              <li key={annonce.id}>
                <Link to={`/admin/annonces/${annonce.id}`} className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-4 py-3 hover:bg-surface/60">
                  <div className="min-w-0">
                    <p className="truncate text-title font-semibold text-encre">{annonce.titre || "Sans titre"}</p>
                    <p className="truncate text-body-m text-texte2">
                      {[
                        annonce.proprietaire ? `${annonce.proprietaire.prenom ?? ""} ${annonce.proprietaire.nom ?? ""}`.trim() : null,
                        annonce.ville,
                        formatIlYA(annonce.createdAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusBadge tone="attente">En attente</StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarresHorizontales titre="Annonces par statut" barres={parStatut} vide="Aucune annonce pour l'instant." />
        <BarresHorizontales
          titre="Publiées par type de logement"
          barres={stats.annoncesByTypeLogement.map(({ nom, count }) => ({ libelle: nom, valeur: count }))}
          vide="Aucune annonce publiée."
        />
        <BarresHorizontales
          titre="Publiées par type de transaction"
          barres={stats.annoncesByTypeTransaction.map(({ nom, count }) => ({ libelle: nom, valeur: count }))}
          vide="Aucune annonce publiée."
        />
        <BarresHorizontales
          titre="Villes les plus représentées"
          barres={stats.topVilles.map(({ ville, count }) => ({ libelle: ville, valeur: count }))}
          vide="Aucune annonce publiée."
        />
      </div>
    </div>
  );
}
