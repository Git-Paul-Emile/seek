import { Link } from "react-router-dom";
import { Building2, CircleCheck, FileText, Plus, TrendingDown, TrendingUp, TriangleAlert, UserPlus, Wallet } from "lucide-react";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { Button } from "@/components/ui/button";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { KpiCard } from "@/components/owner/dashboard/KpiCard";
import { EncaissementsChart } from "@/components/owner/dashboard/EncaissementsChart";
import { SuiviLoyers } from "@/components/owner/dashboard/SuiviLoyers";
import { AlerteRetards, BandeauMobile } from "@/components/owner/dashboard/BandeauMobile";
import { ApercuBiensTable, ListeAFaire, RepartitionBiens } from "@/components/owner/dashboard/BlocsBiens";
import { useTableauDeBordProprietaire } from "@/components/owner/dashboard/useTableauDeBordProprietaire";
import { formatFcfa, formatMontant, NO_BREAK_SPACE } from "@/lib/fcfa";

// Tableau de bord propriétaire : planche 33 (mobile) et planche 40 (desktop).

type Donnees = ReturnType<typeof useTableauDeBordProprietaire>;

// Aperçu limité comme sur les maquettes ; « Tout voir » ouvre le suivi complet.
const NB_LIGNES_SUIVI = 3;

function TitreSection({ titre, lien }: { titre: string; lien?: { to: string; label: string } }) {
  return (
    <div className="mb-4 grid grid-cols-[1fr_auto] items-baseline gap-4">
      <h2 className="font-display text-h3 font-bold text-encre lg:text-h3">{titre}</h2>
      {lien && (
        <Link to={lien.to} className="text-body-m font-semibold text-baobab hover:underline">
          {lien.label}
        </Link>
      )}
    </div>
  );
}

const ACTIONS_RAPIDES = [
  { to: "/owner/biens/ajouter", label: "Publier un bien", icon: Plus },
  { to: "/owner/locataires/ajouter", label: "Inviter un locataire", icon: UserPlus },
  // Un bail se crée depuis la fiche d'un bien libre : on ouvre la liste filtrée.
  { to: "/owner/biens?filtre=NON_ASSOCIE", label: "Créer un bail", icon: FileText },
];

function EtatVide() {
  return (
    <section className="mx-4 rounded-card border border-filet bg-white p-6 text-center lg:mx-0 lg:p-10">
      <div className="mx-auto h-40 max-w-xs overflow-hidden rounded-card">
        <PropertyIllustration kind="villa" />
      </div>
      <h2 className="mt-6 font-display text-h3 font-bold text-encre">Publiez votre premier bien</h2>
      <p className="mx-auto mt-2 max-w-md text-body-l text-texte2">
        Ajoutez un logement pour recevoir des demandes de visite, puis suivez ici vos loyers et vos locataires.
      </p>
      <Button asChild className="mt-6">
        <Link to="/owner/biens/ajouter">
          <Plus aria-hidden />
          Publier un bien
        </Link>
      </Button>
    </section>
  );
}

function VueMobile({ d }: { d: Donnees }) {
  return (
    <div className="space-y-8 px-4 pt-6 lg:hidden">
      {d.retards.nombre > 0 && <AlerteRetards nombre={d.retards.nombre} total={d.retards.total} />}
      <ul className="grid grid-cols-3 gap-3">
        {ACTIONS_RAPIDES.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="flex h-full flex-col justify-between gap-6 rounded-card bg-white p-4">
              <span className="flex size-11 items-center justify-center rounded-control bg-baobab-100 text-baobab">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="text-body-m font-semibold leading-tight text-encre">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <TitreSection titre="Loyers en retard" lien={{ to: "/owner/loyers-retard", label: "Tout voir" }} />
        <div className="rounded-card bg-white px-4">
          <SuiviLoyers lignes={d.lignesSuivi.slice(0, NB_LIGNES_SUIVI)} compact />
        </div>
      </section>
      {d.taches.length > 0 && (
        <section>
          <TitreSection titre="À faire" />
          <ListeAFaire taches={d.taches} />
        </section>
      )}
      <section>
        <TitreSection titre="Mes biens" lien={{ to: "/owner/biens", label: "Voir les biens" }} />
        <RepartitionBiens repartition={d.repartitionBiens} />
      </section>
    </div>
  );
}

function CartesChiffresCles({ d }: { d: Donnees }) {
  const { occupes, libres, travaux, total } = d.repartitionBiens;
  const detailBiens = [`${occupes} occupé${occupes > 1 ? "s" : ""}`, `${libres} libre${libres > 1 ? "s" : ""}`];
  if (travaux > 0) detailBiens.push(`${travaux} en travaux`);
  const Tendance = (d.variation ?? 0) < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
      <KpiCard
        icon={Wallet}
        label={`Loyers reçus en ${d.moisCourant}`}
        value={formatMontant(d.encaisse)}
        unit="FCFA"
        footer={
          d.variation !== null && d.moisPrecedentLibelle ? (
            <span className="flex items-center gap-1.5">
              <Tendance aria-hidden className="size-4 text-encre" />
              <strong className="text-encre">
                {d.variation > 0 ? "+" : ""}
                {d.variation}{NO_BREAK_SPACE}%
              </strong>
              par rapport à {d.moisPrecedentLibelle}
            </span>
          ) : null
        }
      />
      <KpiCard
        icon={CircleCheck}
        label="Taux de recouvrement"
        value={d.tauxRecouvrement === null ? "-" : `${d.tauxRecouvrement}${NO_BREAK_SPACE}%`}
        footer={
          d.tauxRecouvrement === null ? (
            "Aucun loyer attendu ce mois-ci"
          ) : (
            <div className="h-2.5 overflow-hidden rounded-full bg-surface" aria-hidden>
              <div className="h-full rounded-full bg-baobab" style={{ width: `${Math.min(d.tauxRecouvrement, 100)}%` }} />
            </div>
          )
        }
      />
      <KpiCard icon={Building2} label="Biens" value={total} footer={detailBiens.join(" · ")} />
      <KpiCard
        icon={TriangleAlert}
        tone="alerte"
        label="Loyers en retard"
        value={d.retards.nombre}
        unit={d.retards.nombre > 0 ? `· ${formatFcfa(d.retards.total)}` : undefined}
        footer={
          <Link to="/owner/loyers-retard" className="font-semibold text-encre underline underline-offset-4">
            {d.retards.nombre > 0 ? "Relancer les locataires" : "Voir le suivi des loyers"}
          </Link>
        }
      />
    </div>
  );
}

function VueDesktop({ d, prenom }: { d: Donnees; prenom: string }) {
  const panneau = "min-w-0 rounded-card border border-filet bg-white p-6";
  return (
    <div className="hidden space-y-6 lg:block">
      <header className="grid grid-cols-[1fr_auto] items-end gap-6">
        <div>
          <p className="text-body-l text-texte2">{d.dateDuJour}</p>
          <h1 className="font-display text-h1 font-bold text-encre">Bonjour {prenom}</h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/owner/locataires/ajouter">
              <UserPlus aria-hidden />
              Inviter un locataire
            </Link>
          </Button>
          <Button asChild>
            <Link to="/owner/biens/ajouter">
              <Plus aria-hidden />
              Publier un bien
            </Link>
          </Button>
        </div>
      </header>
      <CartesChiffresCles d={d} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <EncaissementsChart data={d.encaissementsMensuels} />
        <section className={panneau}>
          <TitreSection titre="Loyers en retard" lien={{ to: "/owner/loyers-retard", label: "Tout voir" }} />
          <SuiviLoyers lignes={d.lignesSuivi.slice(0, NB_LIGNES_SUIVI)} />
        </section>
      </div>
      <section className={panneau}>
        <TitreSection
          titre="Mes biens"
          lien={{ to: "/owner/biens", label: `Voir les ${d.repartitionBiens.total} biens` }}
        />
        <ApercuBiensTable lignes={d.lignesBiens} moisCourant={d.moisCourant} />
      </section>
      {d.taches.length > 0 && (
        <section>
          <TitreSection titre="À faire" />
          <ListeAFaire taches={d.taches} />
        </section>
      )}
    </div>
  );
}

function Chargement() {
  return (
    <div className="space-y-6 px-4 pt-6 lg:px-0 lg:pt-0" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="h-40 animate-pulse rounded-card bg-white" />
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-card bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-card bg-white" />
    </div>
  );
}

export default function OwnerDashboard() {
  const { owner } = useOwnerAuth();
  const d = useTableauDeBordProprietaire();
  const prenom = owner?.prenom ?? "";

  if (d.isLoading) return <Chargement />;

  const sansBien = d.repartitionBiens.total === 0;
  const dateCourte = d.dateDuJour.replace(/ \d{4}$/, "");

  return (
    <div className="pb-6 lg:pb-0">
      <div className="lg:hidden">
        <BandeauMobile
          prenom={prenom}
          dateCourte={dateCourte}
          nbBiens={d.repartitionBiens.total}
          moisCourant={d.moisCourant}
          encaisse={d.encaisse}
          attendu={d.attendu}
          tauxRecouvrement={d.tauxRecouvrement}
        />
      </div>
      {d.isError && (
        <p role="alert" className="mx-4 mt-6 rounded-control bg-soleil-100 p-4 text-body-m text-encre lg:mx-0 lg:mt-0">
          Les chiffres des loyers n'ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      )}
      {sansBien ? (
        <div className="pt-6 lg:pt-0">
          <EtatVide />
        </div>
      ) : (
        <>
          <VueMobile d={d} />
          <VueDesktop d={d} prenom={prenom} />
        </>
      )}
    </div>
  );
}
